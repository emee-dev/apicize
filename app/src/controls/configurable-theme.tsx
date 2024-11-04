import { useApicizeSettings } from "@apicize/toolkit"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { observer } from "mobx-react-lite"
import { ReactNode } from "react"

export const ConfigurableTheme = observer((props: { children?: ReactNode }) => {
  const settings = useApicizeSettings()

  const palette = createTheme()

  const isDark = settings.colorScheme === 'dark'

  const theme = createTheme({
    palette: {
      mode: settings.colorScheme,
      navigation: palette.palette.augmentColor({
        color: {
          main: isDark ? '#202020' : '#F0F0F0',
        },
        name: 'toolbar'
      }),
      toolbar: palette.palette.augmentColor({
        color: {
          main: isDark ? '#404040' : '#E0E0E0',
        },
        name: 'toolbar'
      }),
      folder: palette.palette.augmentColor({
        color: {
          main: isDark ? '#FFD700' : '#e6c300'
        },
        name: 'folder'
      }),
      request: palette.palette.augmentColor({
        color: {
          main: '#008B8B'
        },
        name: 'request'
      }),
      scenario: palette.palette.augmentColor({
        color: {
          main: '#00BFFF'
        },
        name: 'request'
      }),
      authorization: palette.palette.augmentColor({
        color: {
          main: '#8000FF'
        },
        name: 'request'
      }),
      certificate: palette.palette.augmentColor({
        color: {
          main: '#FF8C00'
        },
        name: 'request'
      }),
      proxy: palette.palette.augmentColor({
        color: {
          main: '#FA8072'
        },
        name: 'request'
      }),
      private: palette.palette.augmentColor({
        color: {
          main: '#f76b8a'
        },
        name: 'request'
      }),
      global: palette.palette.augmentColor({
        color: {
          main: '#38598b'
        },
        name: 'request'
      }),
    },
    typography: {
      fontSize: settings.fontSize,
      fontFamily: "'Open Sans','sans'"
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minWidth: '4em'
          }
        }
      },
      MuiTreeItem: {
        styleOverrides: {
          content: {
            padding: '0.02em'
          }
        }
      },
      //   MuiIconButton: {
      //     defaultProps: {
      //       sx: { padding: '0.05em' }
      //     }
      //   },
      //   MuiListItemIcon: {
      //     defaultProps: {
      //       sx: {
      //         minWidth: '36px'
      //       }
      //     }
      //   },
      //   MuiInputBase: {
      //     styleOverrides: {
      //       input: {
      //         "&.code": {
      //           fontFamily: 'monospace',
      //         }
      //       }
      //     }
      //   },
      MuiTypography: {
        styleOverrides: {
          h1: {
            fontSize: '1.5em',
            fontWeight: 'normal',
            // marginTop: '0.1em',
            marginBottom: '1.5em'
          },
          h2: {
            fontSize: '1.3em',
            fontWeight: 'normal',
            marginTop: '1.5em',
            marginBottom: '1.0em',
          },
          h3: {
            fontSize: '1.2em',
            fontWeight: 'normal',
            marginTop: '1.5em',
            marginBottom: '1.0em',
          }
        }
      }
    },
  })

  return (
    <ThemeProvider theme={theme}>
      {props.children}
    </ThemeProvider>
  )
})