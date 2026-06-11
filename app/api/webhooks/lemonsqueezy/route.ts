// app/api/webhooks/lemonsqueezy/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

function getPlanFromVariantId(variantId: string): 'STARTER' | 'PRO' | 'FREE' {
    const starterId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STARTER_VARIANT_ID
    const proId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRO_VARIANT_ID

    if (variantId === starterId) return 'STARTER'
    if (variantId === proId) return 'PRO'
    return 'FREE'
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text()
        const signature = req.headers.get('x-signature') || ''
        const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || ''

        const hmac = crypto.createHmac('sha256', secret)
        const digest = hmac.update(rawBody).digest('hex')

        if (!crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'))) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const payload = JSON.parse(rawBody)
        const eventName = payload.meta?.event_name
        const attributes = payload.data?.attributes
        const subscriptionId = payload.data?.id?.toString()

        if (!subscriptionId || !attributes) {
            return NextResponse.json({ error: 'Incomplete data' }, { status: 400 })
        }

        if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
            const variantId = attributes.variant_id?.toString()
            const plan = getPlanFromVariantId(variantId)
            const status = attributes.status

            const renewsAt = attributes.renews_at ? new Date(attributes.renews_at) : null
            const endsAt = attributes.ends_at ? new Date(attributes.ends_at) : null
            const customerId = attributes.customer_id?.toString()

            let userId = payload.meta?.custom_data?.user_id

            if (!userId) {
                const existingSub = await prisma.subscription.findUnique({
                    where: { lsSubscriptionId: subscriptionId }
                })
                userId = existingSub?.userId
            }

            if (!userId) {
                return NextResponse.json({ error: 'User mapping not found' }, { status: 400 })
            }

            const targetPlan = status === 'expired' ? 'FREE' : plan

            await prisma.$transaction([
                prisma.subscription.upsert({
                    where: { lsSubscriptionId: subscriptionId },
                    create: {
                        userId,
                        lsSubscriptionId: subscriptionId,
                        lsCustomerId: customerId,
                        variantId,
                        plan,
                        status,
                        renewsAt,
                        endsAt,
                    },
                    update: {
                        status,
                        plan,
                        variantId,
                        renewsAt,
                        endsAt,
                    }
                }),
                prisma.user.update({
                    where: { id: userId },
                    data: { plan: targetPlan }
                })
            ])
        }

        return NextResponse.json({ received: true }, { status: 200 })

    } catch (error) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
}