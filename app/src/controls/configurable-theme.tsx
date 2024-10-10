import { useApicizeSettings } from "@apicize/toolkit"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { observer } from "mobx-react-lite"
import { ReactNode } from "react"
import "@mui/x-data-grid"

export const ConfigurableTheme = observer((props: { children?: ReactNode }) => {
  const settings = useApicizeSettings()

  const theme = createTheme({
    palette: {
      mode: settings.colorScheme,
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
    //   MuiTreeItem: {
    //     styleOverrides: {
    //       content: {
    //         padding: '0.02em'
    //       }
    //     },
    //   },
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
            fontSize: '1.1em',
            fontWeight: 'normal',
            marginTop: '1.5em',
            marginBottom: '1.0em',
          }
        }
      }
    },
  })

  const theme1 = createTheme({
    palette: {
      mode: settings.colorScheme,
    },
  })

  return (
    <ThemeProvider theme={theme}>
      {props.children}
    </ThemeProvider>
  )
})