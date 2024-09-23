'use client'

import * as core from '@tauri-apps/api/core'
import { Navigation, WorkspaceStore } from '@apicize/toolkit'
import type { } from '@mui/x-tree-view/themeAugmentation';
import { Stack, CssBaseline, ThemeProvider, createTheme, alpha } from '@mui/material'
import { } from '@apicize/toolkit'
import React from 'react'
import "typeface-open-sans"
import Pane from './pane';
import { ClipboardProvider } from './providers/clipboard.provider';
import { FeedbackProvider } from './providers/feedback.provider';
import { FileOperationsProvider } from './providers/file-operations.provider';
import { WorkspaceProvider } from './providers/workspace.provider';
import { ApicizeExecutionResults } from '@apicize/lib-typescript';

const store = new WorkspaceStore({
  onExecuteRequest: (workspace, requestId) => core.invoke<ApicizeExecutionResults>
    ('run_request', { workspace, requestId }),
  onCancelRequest: (requestId) => core.invoke(
    'cancel_request', { requestId }),
  onClearToken: (authorizationId) => core.invoke(
    'clear_cached_authorization', { authorizationId })
})

export default function Home() {

  const darkTheme = createTheme({
    typography: {
      fontSize: 12,
      fontFamily: "'Open Sans','sans'"
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minWidth: '120px'
          }
        }
      },
      MuiTreeItem: {
        styleOverrides: {
          root: {
            // There is no way to explicitly set focus in MUI TreeView, so don't use it
            "& > .MuiTreeItem-content.Mui-focused": {
              backgroundColor: alpha("#000", 0)
            },
            "& > .MuiTreeItem-content.Mui-selected": {
              backgroundColor: alpha("#FFF", 0.2)
            }
          }
        }
      },

      MuiIconButton: {
        defaultProps: {
          sx: { padding: '3px' }
        }
      },
      MuiListItemIcon: {
        defaultProps: {
          sx: {
            minWidth: '36px'
          }
        }
      },
      // .css-18ax2bx-MuiInputBase-input-MuiOutlinedInput-input {
      MuiInputBase: {
        styleOverrides: {
          input: {
            "&.code": {
              fontFamily: 'monospace'
            }
          }
        }
      },
      MuiTypography: {
        styleOverrides: {
          h1: {
            fontSize: '1.5rem',
            fontWeight: 'normal',
            marginTop: '0.1rem',
            marginBottom: '1.5rem'
          },
          h2: {
            fontSize: '1.3rem',
            fontWeight: 'normal',
            marginTop: '1.5rem',
            marginBottom: '1.0rem',
          },
          h3: {
            fontSize: '1.1rem',
            fontWeight: 'normal',
            marginTop: '1.5rem',
            marginBottom: '1.0rem',
          }
        }
      }
    },
    palette: {
      mode: 'dark',
    },
  })

  return (
    <ThemeProvider theme={darkTheme}>
      <FeedbackProvider>
        <FileOperationsProvider store={store}>
          <WorkspaceProvider store={store}>
            <CssBaseline />
            <ClipboardProvider>
              <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex', padding: '0' }}>
                <Navigation />
                <Pane />
              </Stack>
            </ClipboardProvider>
          </WorkspaceProvider>
        </FileOperationsProvider>
      </FeedbackProvider>
    </ThemeProvider>
  )
}

