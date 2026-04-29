export const metadata = {
  title: 'stokradar',
  description: 'Markets · Intelligence · Edge',
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
