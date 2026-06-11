// components/SidebarNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarNavProps {
    dict: {
        dashboard: string
        documents: string
        settings: string
    }
}

export function SidebarNav({ dict }: SidebarNavProps) {
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname.startsWith(href)
    }

    const links = [
        { href: '/dashboard', label: dict.dashboard },
        { href: '/documents', label: dict.documents },
        { href: '/settings', label: dict.settings },
    ]

    return (
        <nav className="space-y-1 flex-1">
            {links.map((link) => {
                const active = isActive(link.href)
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            active
                                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        {link.label}
                    </Link>
                )
            })}
        </nav>
    )
}