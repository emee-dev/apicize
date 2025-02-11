import '@mui/material/styles'

declare module '@mui/material/styles' {
    interface Palette {
        navigation: Palette['primary']
        toolbar: Palette['primary']
        folder: Palette['primary']
        request: Palette['primary']
        scenario: Palette['primary']
        authorization: Palette['primary']
        certificate: Palette['primary']
        proxy: Palette['primary']
        defaults: Palette['primary']
    }

    interface PaletteOptions {
        navigation?: PaletteOptions['primary']
        toolbar?: PaletteOptions['primary']
        folder?: PaletteOptions['primary']
        request?: PaletteOptions['primary']
        scenario?: PaletteOptions['primary']
        authorization?: PaletteOptions['primary']
        certificate?: PaletteOptions['primary']
        proxy?: PaletteOptions['primary']
        public?: PaletteOptions['primary']
        private?: PaletteOptions['primary']
        vault?: PaletteOptions['primary']
        defaults?: PaletteOptions['primary']
    }
}

declare module '@mui/material/IconButton' {
    interface IconButtonPropsColorOverrides {
        folder: true
        request: true
        scenario: true
        authorization: true
        certificate: true
        proxy: true
        public: true
        private: true
        vault: true
    }
}

declare module '@mui/material/SvgIcon' {
    interface SvgIconPropsColorOverrides {
        folder: true
        request: true
        scenario: true
        authorization: true
        certificate: true
        proxy: true,
        public: true
        private: true
        vault: true
        defaults: true
    }
}
