// app/(app)/dashboard/settings/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SettingsClient from './SettingsClient'
import { getDictionary } from "@/lib/i18n"

export const metadata = {
    title: 'Settings',
}

export default async function SettingsPage() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
        include: {
            notificationSettings: true,
            telegramSession: true,
            subscriptions: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })
    if (!dbUser) redirect('/login')

    const dict = getDictionary(dbUser?.language ?? 'en')

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {dict.app.settings.title}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    {dict.app.settings.subtitle}
                </p>
            </div>

            <SettingsClient user={dbUser} />
        </div>
    )
}