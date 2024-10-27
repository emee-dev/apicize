import InitColorSchemeScript from '@mui/system/InitColorSchemeScript'

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
