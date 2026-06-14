import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const {
            inAppLetterViewed,
            inAppPaymentClaimed,
            emailLetterViewed,
            emailPaymentClaimed,
            tgLetterViewed,
            tgPaymentClaimed
        } = body

        await prisma.user.update({
            where: { authId: user.id },
            data: {
                notificationSettings: {
                    upsert: {
                        create: {
                            inAppLetterViewed: !!inAppLetterViewed,
                            inAppPaymentClaimed: !!inAppPaymentClaimed,
                            emailLetterViewed: !!emailLetterViewed,
                            emailPaymentClaimed: !!emailPaymentClaimed,
                            tgLetterViewed: !!tgLetterViewed,
                            tgPaymentClaimed: !!tgPaymentClaimed,
                        },
                        update: {
                            inAppLetterViewed: !!inAppLetterViewed,
                            inAppPaymentClaimed: !!inAppPaymentClaimed,
                            emailLetterViewed: !!emailLetterViewed,
                            emailPaymentClaimed: !!emailPaymentClaimed,
                            tgLetterViewed: !!tgLetterViewed,
                            tgPaymentClaimed: !!tgPaymentClaimed,
                        }
                    }
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}