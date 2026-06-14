import { ReactNode } from 'react'
import '@/app/globals.css'

export const metadata = {
    title: 'Moonlight PayHub — Secure Payment',
    description: 'Secure invoice and payment gateway',
    robots: 'noindex, nofollow',
}

interface LayoutProps {
    children: ReactNode
}

export default function PublicPaymentLayout({ children }: LayoutProps) {
    return (
        <html lang="uk">
        <body className="antialiased bg-slate-50 m-0 p-0">
        {children}
        </body>
        </html>
    )
}