import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EstiloVale4',
  description: 'Created with atenea',
  generator: 'atenea.dev',
 icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
