// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`)
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                },
            },
        }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`)
    }

    await prisma.user.upsert({
        where: { authId: data.user.id },
        create: {
            authId: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name ?? null,
            avatarUrl: data.user.user_metadata?.avatar_url ?? null,
        },
        update: {
            email: data.user.email!,
            name: data.user.user_metadata?.name ?? null,
            avatarUrl: data.user.user_metadata?.avatar_url ?? null,
        },
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)
}