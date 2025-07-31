import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EstiloVale4',
  description: 'Created with atenea',
  generator: 'atenea.dev',
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
