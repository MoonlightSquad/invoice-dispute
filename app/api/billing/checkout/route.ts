// app/api/billing/checkout/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const { variantId } = await req.json()
        if (!variantId) return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 })

        const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json'
            },
            body: JSON.stringify({
                data: {
                    type: 'checkouts',
                    attributes: {
                        checkout_data: {
                            email: dbUser.email,
                            name: dbUser.name || '',
                            custom: {
                                user_id: dbUser.id
                            }
                        },
                        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
                    },
                    relationships: {
                        store: {
                            data: { type: 'stores', id: process.env.LEMON_SQUEEZY_STORE_ID }
                        },
                        variant: {
                            data: { type: 'variants', id: variantId.toString() }
                        }
                    }
                }
            })
        })

        const resData = await response.json()
        if (!response.ok) {
            console.error('Lemon Squeezy Error:', resData)
            throw new Error('Failed to create checkout session')
        }

        const checkoutUrl = resData.data?.attributes?.url
        return NextResponse.json({ url: checkoutUrl })

    } catch (error) {
        console.error('Billing Checkout Error:', error)
        return NextResponse.json({ error: 'checkout_failed' }, { status: 500 })
    }
}