import { useApicizeSettings } from "@apicize/toolkit"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { observer } from "mobx-react-lite"
import { ReactNode } from "react"

export const ConfigurableTheme = observer((props: { children?: ReactNode }) => {
  const settings = useApicizeSettings()

  const theme = createTheme({
    palette: {
      mode: settings.colorScheme,
    },
    // colorSchemes: { dark: true },
    // cssVariables: {
    //   colorSchemeSelector: 'class'
    // },
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
        },
      },
      MuiIconButton: {
        defaultProps: {
          sx: { padding: '0.05em' }
        }
      },
      MuiListItemIcon: {
        defaultProps: {
          sx: {
            minWidth: '36px'
          }
        }
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            "&.code": {
              fontFamily: 'monospace',
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
  })
  return (
    <ThemeProvider theme={theme}>
      {props.children}
    </ThemeProvider>
  )
})