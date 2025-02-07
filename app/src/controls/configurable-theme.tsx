import { useApicizeSettings } from "@apicize/toolkit"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { TypographyOptions } from "@mui/material/styles/createTypography";
import { observer } from "mobx-react-lite"
import { ReactNode } from "react"

interface ExtendedTypographyOptions extends TypographyOptions {
  code: React.CSSProperties;
}

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
        name: 'navigation'
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
          main: '#00ace6'
        },
        name: 'request'
      }),
      scenario: palette.palette.augmentColor({
        color: {
          main: '#0073e6'
        },
        name: 'request'
      }),
      authorization: palette.palette.augmentColor({
        color: {
          main: '#A0A0A0'
        },
        name: 'authorization'
      }),
      certificate: palette.palette.augmentColor({
        color: {
          main: '#FF8C00'
        },
        name: 'certificate'
      }),
      proxy: palette.palette.augmentColor({
        color: {
          main: '#cc0099'
        },
        name: 'request'
      }),
      defaults: palette.palette.augmentColor({
        color: {
          main: '#86b300'
        },
        name: 'defaults'
      }),
      public: palette.palette.augmentColor({
        color: {
          main: '#009933'
        },
        name: 'public'
      }),
      private: palette.palette.augmentColor({
        color: {
          main: '#cc9900'
        },
        name: 'private'
      }),
      vault: palette.palette.augmentColor({
        color: {
          main: '#cc2900'
        },
        name: 'vault'
      }),
    },
    typography: {
      fontSize: settings.fontSize,
      fontFamily: "'Open Sans','sans'",
      code: {
        fontFamily: "'Roboto Mono','monospace'"
      }
    } as ExtendedTypographyOptions,
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
            padding: 0,
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
          },
        }
      }
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <div className={isDark ? 'dark' : 'light'}>
        {props.children}
      </div>
    </ThemeProvider>
  )
})