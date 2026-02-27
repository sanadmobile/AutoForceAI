import type { Metadata } from 'next'
import './globals.css'
import AuthWrapper from '../components/AuthWrapper'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: '思渡AI | 数字员工平台',
  description: 'Manage your Digital Workforce and GEO Assets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" className="dark">
      <body>
        <AuthWrapper>
            {children}
            <Toaster position="top-right" richColors />
        </AuthWrapper>
      </body>
    </html>
  )
}
