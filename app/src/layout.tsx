import InitColorSchemeScript from '@mui/system/InitColorSchemeScript'
import './globals.css'


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <InitColorSchemeScript attribute="class" />
      <body>{children}</body>
    </html>
  )
}
