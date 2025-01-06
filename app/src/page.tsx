'use client'

import * as core from '@tauri-apps/api/core'
import { ApicizeSettings, AuthorizationEditor, CertificateEditor, HelpPanel, Navigation, ProxyEditor, RequestEditor, ScenarioEditor, SettingsEditor, WorkspaceStore } from '@apicize/toolkit'
import type { } from '@mui/x-tree-view/themeAugmentation';
import { Stack, CssBaseline } from '@mui/material'
import { } from '@apicize/toolkit'
import React, { } from 'react'
import "typeface-open-sans"
import "typeface-roboto-mono"
import { ClipboardProvider } from './providers/clipboard.provider';
import { FeedbackProvider } from './providers/feedback.provider';
import { FileOperationsProvider } from './providers/file-operations.provider';
import { WorkspaceProvider } from './providers/workspace.provider';
import { ApicizeExecution, StoredGlobalSettings, WorkbookOAuth2PkceAuthorization } from '@apicize/lib-typescript';
import { ApicizeSettingsProvider } from './providers/apicize-settings.provider';
import { ConfigurableTheme } from './controls/configurable-theme';
import { PkceProvider } from './providers/pkce.provider';
import { emit } from '@tauri-apps/api/event';

const workspaceStore = new WorkspaceStore({
  onExecuteRequest: async (workspace, requestId, overrideNumberOfRuns) => core.invoke<ApicizeExecution>
    ('run_request', { workspace, requestId, overrideNumberOfRuns }),
  onCancelRequest: (requestId) => core.invoke(
    'cancel_request', { requestId }),
  onClearToken: (authorizationId) => core.invoke(
    'clear_cached_authorization', { authorizationId }),
  onInitializePkce: (data: { authorizationId: string }) =>
    emit('oauth2-pkce-init', data),
  onClosePkce: (data: { authorizationId: string }) =>
    emit('oauth2-pkce-close', data),
  onRefreshToken: (data: { authorizationId: string }) =>
    emit('oauth2-refresh-token', data),
})

// This is defined externally via Tauri main or other boostrap application
declare var loadedSettings: StoredGlobalSettings
const settings = new ApicizeSettings(loadedSettings)

export default function Home() {

  return (
    <ApicizeSettingsProvider store={settings}>
      <ConfigurableTheme>
        <CssBaseline />
        <FeedbackProvider>
          <FileOperationsProvider store={workspaceStore}>
            <WorkspaceProvider store={workspaceStore}>
              <PkceProvider store={workspaceStore}>
                <ClipboardProvider>
                  <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex', padding: '0' }}>
                    <Navigation onSettings={() => settings.showSettings = true} />
                    <>
                      <HelpPanel />
                      <RequestEditor />
                      <ScenarioEditor
                        sx={{ display: 'block', flexGrow: 1 }}
                      />
                      <AuthorizationEditor
                        sx={{ display: 'block', flexGrow: 1 }}
                      />
                      <CertificateEditor
                        sx={{ display: 'block', flexGrow: 1 }}
                      />
                      <ProxyEditor
                        sx={{ display: 'block', flexGrow: 1 }}
                      />
                      <SettingsEditor
                        sx={{ display: 'block', flexGrow: 1 }}
                      />
                    </>
                  </Stack>
                </ClipboardProvider>
              </PkceProvider>
            </WorkspaceProvider>
          </FileOperationsProvider>
        </FeedbackProvider>
      </ConfigurableTheme>
    </ApicizeSettingsProvider>
  )
}
