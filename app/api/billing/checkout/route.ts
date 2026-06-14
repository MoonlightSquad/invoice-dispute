// app/api/billing/checkout/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Plan } from '@/generated/prisma/enums'

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

        const { planType } = await req.json()
        if (!planType) return NextResponse.json({ error: 'Plan type is required' }, { status: 400 })

        let amount = 0
        let targetPlan: Plan

        if (planType === 'FREE') {
            targetPlan = Plan.FREE
        } else if (planType === 'STARTER') {
            amount = 1900
            targetPlan = Plan.STARTER
        } else if (planType === 'PRO') {
            amount = 4900
            targetPlan = Plan.PRO
        } else {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
        }

        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                userId: dbUser.id,
                status: 'success'
            }
        })

        for (const sub of activeSubscriptions) {
            if (sub.lsSubscriptionId && sub.status !== 'cancelled') {
                try {
                    const removeResponse = await fetch('https://api.monobank.ua/api/merchant/subscription/remove', {
                        method: 'POST',
                        headers: {
                            'X-Token': process.env.MONO_API_KEY!,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            subscriptionId: sub.lsSubscriptionId
                        })
                    })

                    const removeData = await removeResponse.json()

                    if (!removeResponse.ok) {
                        console.error(`Monobank Subscription Remove Error (${sub.lsSubscriptionId}):`, removeData)
                    } else {
                        console.log(`Successfully cancelled subscription in Monobank: ${sub.lsSubscriptionId}`)
                    }
                } catch (err) {
                    console.error(`Failed to communicate with Monobank remove endpoint for ${sub.lsSubscriptionId}:`, err)
                }
            }

            await prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    status: 'cancelled',
                    endsAt: new Date()
                }
            })
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL

        if (targetPlan === Plan.FREE) {
            await prisma.user.update({
                where: { id: dbUser.id },
                data: { plan: Plan.FREE }
            })

            return NextResponse.json({ url: `${baseUrl}/settings` })
        }

        const response = await fetch('https://api.monobank.ua/api/merchant/subscription/create', {
            method: 'POST',
            headers: {
                'X-Token': process.env.MONO_API_KEY!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                ccy: 840,
                redirectUrl: `${baseUrl}/settings`,
                webHookUrls: {
                    statusUrl: `${baseUrl}/api/webhooks/billing?userId=${dbUser.id}&plan=${targetPlan}`,
                    chargeUrl: `${baseUrl}/api/webhooks/billing?userId=${dbUser.id}&plan=${targetPlan}`
                },
                interval: '1m',
                validity: 2592000
            })
        })

        const resData = await response.json()
        if (!response.ok) {
            console.error('Monobank Error:', resData)
            throw new Error(resData.errText || 'Failed to create Monobank subscription')
        }

        return NextResponse.json({ url: resData.pageUrl })

    } catch (error) {
        console.error('Billing Checkout Error:', error)
        return NextResponse.json({ error: 'checkout_failed' }, { status: 500 })
    }
}