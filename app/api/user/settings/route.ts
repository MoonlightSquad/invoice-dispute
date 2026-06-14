// app/api/user/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { language } = await req.json()
        if (!['uk', 'en'].includes(language)) {
            return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
        }

        await prisma.user.update({
            where: { authId: user.id },
            data: { language }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        Sentry.captureException(error)

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}