'use client'

import * as core from '@tauri-apps/api/core'
import { ApicizeSettingsStore, AuthorizationEditor, CertificateEditor, HelpPanel, Navigation, ProxyEditor, RequestEditor, ScenarioEditor, SettingsEditor, WorkspaceStore } from '@apicize/toolkit'
import type { } from '@mui/x-tree-view/themeAugmentation';
import { Stack, CssBaseline } from '@mui/material'
import { } from '@apicize/toolkit'
import React, { } from 'react'
import "typeface-open-sans"
import { ClipboardProvider } from './providers/clipboard.provider';
import { FeedbackProvider } from './providers/feedback.provider';
import { FileOperationsProvider } from './providers/file-operations.provider';
import { WorkspaceProvider } from './providers/workspace.provider';
import { ApicizeExecution } from '@apicize/lib-typescript';
import { ApicizeSettingsProvider } from './providers/apicize-settings.provider';
import { ConfigurableTheme } from './controls/configurable-theme';

const store = new WorkspaceStore({
  onExecuteRequest: async (workspace, requestId, overrideRuns) => core.invoke<ApicizeExecution>
      ('run_request', { workspace, requestId, overrideRuns }),
  onCancelRequest: (requestId) => core.invoke(
    'cancel_request', { requestId }),
  onClearToken: (authorizationId) => core.invoke(
    'clear_cached_authorization', { authorizationId })
})

const settings = new ApicizeSettingsStore()

export default function Home() {

  return (
    <ApicizeSettingsProvider store={settings}>
      <ConfigurableTheme>
        <CssBaseline />
        <FeedbackProvider>
          <FileOperationsProvider store={store}>
            <WorkspaceProvider store={store}>
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
            </WorkspaceProvider>
          </FileOperationsProvider>
        </FeedbackProvider>
      </ConfigurableTheme>
    </ApicizeSettingsProvider>
  )
}
