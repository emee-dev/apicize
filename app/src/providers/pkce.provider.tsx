import { ReactNode, useEffect, useRef } from "react";
import * as core from '@tauri-apps/api/core'
import { PkceContext, ToastSeverity, useApicize, useFeedback, useWorkspace, WorkspaceStore } from "@apicize/toolkit";
import { listen } from "@tauri-apps/api/event";
import { Window } from "@tauri-apps/api/window"
import { Webview } from "@tauri-apps/api/webview"
import { EditableAuthorization } from "@apicize/toolkit";
import { observer } from "mobx-react-lite";
import { autorun, toJS } from "mobx";
import { AuthorizationType, OAuth2PkceAuthorization } from "@apicize/lib-typescript";

/**
 * Implementation of file opeartions via Tauri
 */
export const PkceProvider = observer(({ store, children }: { store: WorkspaceStore, children?: ReactNode }) => {

    const apicize = useApicize()
    const feedback = useFeedback()
    const workspace = useWorkspace()

    const wip = useRef<Map<string, OAuthPkceRequest>>(new Map())
    const window_counter = useRef(1)

    useEffect(() => {
        const unlistenPkceInit = listen<OAuthPkceInitParams>('oauth2-pkce-init', (event) => {
            launchPkceWindow(event.payload)
        })
        const unlistenPkceClose = listen<OAuthPkceInitParams>('oauth2-pkce-close', async (event) => {
            await closePkceWindows(event.payload)
        })
        const unlistenRefreshToken = listen<OAuthPkceInitParams>('oauth2-refresh-token', (event) => {
            refreshToken(event.payload)
        })
        const unlistenPkceAuthResponse = listen<OAuthPkceAuthParams>('oauth2-pkce-auth-response', async (event) => {
            await processOAuth2PkceAuthResponse(event.payload)
        })
        const unlistenPkceSuccess = listen<string>('oauth2-pkce-success', (_event) => {
            // feedback.toast(event.payload, ToastSeverity.Success)
        });

        const unlistenPkceError = listen<string>('oauth2-pkce-error', (event) => {
            feedback.toast(event.payload, ToastSeverity.Error)
        });

        autorun(async () => {
            await core.invoke('set_pkce_port', { port: apicize.pkceListenerPort })
        })

        return () => {
            unlistenPkceInit.then(f => f())
            unlistenPkceClose.then(f => f())
            unlistenRefreshToken.then(f => f())
            unlistenPkceAuthResponse.then(f => f())
            unlistenPkceSuccess.then(f => f())
            unlistenPkceError.then(f => f())
        }
    })

    /**
     * Close any open PKCE windows
     */
    const closePkceWindows = async (params: OAuthPkceInitParams) => {
        const allWindows = await Window.getAll()
        return Promise.all(
            allWindows.filter(w => w.label.startsWith(`apicize-pkce-${params.authorizationId}`)).map(w => w.close())
        )
    }

    /**
     * Launch the PKCE window for the specified PKCE authorization, store information required
     * @param auth 
     */
    const launchPkceWindow = async (params: OAuthPkceInitParams) => {
        try {
            const auth = await workspace.getAuthorization(params.authorizationId)
            if (!auth) {
                throw new Error('Invalid authorization ID')
            }

            if (auth.type !== AuthorizationType.OAuth2Pkce) {
                throw new Error('Authentication must be PKCE')
            }

            let pkce: OAuth2PkceAuthorization = {
                id: auth.id,
                type: auth.type,
                accessTokenUrl: auth.accessTokenUrl,
                authorizeUrl: auth.authorizeUrl,
                audience: auth.audience,
                scope: auth.scope,
                clientId: auth.clientId,
                sendCredentialsInBody: auth.sendCredentialsInBody,
            }

            await closePkceWindows({ authorizationId: pkce.id })

            const info = await core.invoke<OAuthPkceRequest>('generate_authorization_info', {
                auth: pkce,
                port: apicize.pkceListenerPort
            })

            let ctr = window_counter.current
            window_counter.current = ctr + 1

            let lbl = `apicize-pkce-${auth.id}-${ctr}`

            const new_window = new Window(lbl, {
                parent: Window.getCurrent(),
                width: 600,
                height: 600,
                center: true,
                title: 'Apicize OAuth2 PKCE',
                visible: false,
                skipTaskbar: true,
            })

            new_window.once('tauri://created', (e) => {
                const webview = new Webview(new_window, lbl + '-webv', {
                    url: info.url,
                    x: 0,
                    y: 0,
                    width: 600,
                    height: 600,
                    incognito: true,
                })

                webview.once('tauri://created', function () {
                    new_window.show()
                })

                webview.once('tauri://error', function (e) {
                    feedback.toast(`${e.payload ? e.payload : e}`, ToastSeverity.Error)
                })
            })

            new_window.once('tauri://destroyed', function () {
                workspace.cancelPendingPkceAuthorization(auth.id)
            })

            wip.current.set(auth.id, info)
        } catch (e) {
            feedback.toast(`Unable to launch PKCE window: ${e}`, ToastSeverity.Error)
        }
    }

    /**
     * Process the response from PKCE sequence
     * @param response 
     */
    const processOAuth2PkceAuthResponse = async (response: OAuthPkceAuthParams) => {
        let authorizationId: string | null = null
        try {
            let matchAuth: EditableAuthorization | undefined = undefined
            let matchEntry: OAuthPkceRequest | undefined = undefined
            for (const [id, entry] of wip.current) {
                if (entry.csrfToken === response.state) {
                    authorizationId = id
                    matchAuth = await workspace.getAuthorization(id)
                    matchEntry = entry
                    break
                }
            }
            if (!(matchAuth && matchEntry)) {
                throw new Error('OAuth2 response received with invalid CSRF token')
            }
            const exchangeResponse = await core.invoke<OAuthPkceAuthResponse>('retrieve_access_token', {
                tokenUrl: matchAuth.accessTokenUrl,
                redirectUrl: matchEntry.redirectUrl,
                code: response.code,
                clientId: matchAuth.clientId,
                verifier: matchEntry.verifier
            })
            await workspace.updatePkceAuthorization(matchAuth.id, exchangeResponse.accessToken,
                exchangeResponse.refreshToken, exchangeResponse.expiration)
            feedback.toast(`Access token updated`, ToastSeverity.Success)
        } catch (e) {
            if (authorizationId) {
                closePkceWindows({ authorizationId })
            }
            feedback.toast(`${e}`, ToastSeverity.Error)
        }
    }


    /**
     * Use refresh token to request updated access token
     * @param auth 
     */
    const refreshToken = async (params: OAuthPkceInitParams) => {
        try {
            const auth = await workspace.getAuthorization(params.authorizationId)
            if (!auth) {
                throw new Error(`Invalid authorization ID ${params.authorizationId}`)
            }
            if (!auth.refreshToken) return
            const refreshResponse = await core.invoke<OAuthPkceAuthResponse>('refresh_token', {
                tokenUrl: auth.accessTokenUrl,
                refreshToken: auth.refreshToken,
                clientId: auth.clientId
            })
            await workspace.updatePkceAuthorization(auth.id, refreshResponse.accessToken,
                refreshResponse.refreshToken, refreshResponse.expiration
            )
            feedback.toast(`Token refreshed`, ToastSeverity.Success)
        } catch (e) {
            feedback.toast(`${e}`, ToastSeverity.Error)
        }
    }

    return (
        <PkceContext.Provider value={store}>
            {children}
        </PkceContext.Provider>
    )
})

interface OAuthPkceRequest {
    url: string,
    csrfToken: string,
    verifier: string,
    redirectUrl: string,
}

interface OAuthPkceInitParams {
    authorizationId: string
}

interface OAuthPkceAuthParams {
    code: String,
    state: String,
}

interface OAuthPkceAuthResponse {
    accessToken: string,
    refreshToken?: string,
    expiration?: number,
}
