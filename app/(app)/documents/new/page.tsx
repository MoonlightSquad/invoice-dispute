// app/dashboard/documents/new/page.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { prisma } from "@/lib/prisma"
import NewDocumentClient from './NewDocumentClient'

export default async function NewDocumentPage() {
    const cookieStore = await cookies()

    // Ініціалізуємо серверний клієнт Supabase
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/en')

    // Запит до бази даних на сервері
    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id }
    })

    const lang = dbUser?.language || 'en'

    // Передаємо мову пропсом у клієнтський компонент
    return <NewDocumentClient lang={lang} />
}