// app/(app)/documents/[id]/page.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { prisma } from "@/lib/prisma"
import DocumentViewClient from './DocumentViewClient'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function DocumentPage({ params }: PageProps) {
    const { id } = await params
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/en')

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id }
    })

    const lang = dbUser?.language || 'en'

    return <DocumentViewClient id={id} lang={lang} />
}