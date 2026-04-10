import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ממד שוק — ממדים ומיגוניות למכירה',
  description: 'שוק יד שנייה לממ"דים ומיגוניות במחירים נוחים',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
