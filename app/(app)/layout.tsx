import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getDictionary } from '@/lib/i18n'
import { SignOutButton } from '@/components/SignOutButton'
import { SidebarNav } from '@/components/SidebarNav'

import '@/app/globals.css'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => {},
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/en')

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    const dict = getDictionary(dbUser?.language ?? 'en')

    return (
        <html lang={dbUser?.language ?? 'en'}>
        <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="min-h-screen flex">
            <aside className="w-64 border-r bg-white min-h-screen p-4 flex flex-col justify-between">
                <div>
                    <div className="font-bold text-xl text-indigo-600 mb-8">
                        Moonlight
                    </div>

                    <div className="text-xs text-slate-400 mb-6 truncate">
                        {user.email}
                    </div>

                    {/* Інтерактивний клієнтський навігатор */}
                    <SidebarNav dict={dict.app.nav} />
                </div>

                {/* Кнопка виходу залишається знизу сайдбару */}
                <SignOutButton label={dict.app.nav.sign_out} />
            </aside>

            <main className="flex-1 p-8 overflow-auto">
                {children}
            </main>
        </div>
        </body>
        </html>
    )
}