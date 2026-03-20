import type { Metadata } from 'next'
import { Inter, Heebo, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

/**
 * Typography setup:
 * - Inter: Latin characters (geometric, clean, great for dashboards)
 * - Heebo: Hebrew characters (Google's best Hebrew sans-serif, matches Inter's feel)
 * - Geist Mono: Code/data display
 *
 * The CSS font-family stack tries Inter first, falls back to Heebo for Hebrew glyphs.
 */
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const heebo = Heebo({
  variable: '--font-heebo',
  subsets: ['hebrew', 'latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kolio - AI Sales Call Coaching',
  description: 'AI-powered sales call coaching platform for Israeli businesses',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${inter.variable} ${heebo.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
