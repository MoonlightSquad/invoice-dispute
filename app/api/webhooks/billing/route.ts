// app/api/billing/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Plan } from '@/generated/prisma/enums'
export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')
        const plan = searchParams.get('plan')

        if (!userId || !plan) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        const body = await req.json()

        console.log('Monobank Webhook Received:', { userId, plan, body })

        if (body.status === 'success') {

            await prisma.user.update({
                where: { id: userId },
                data: {
                    plan: plan as Plan
                }
            })

            await prisma.subscription.upsert({
                where: {
                    lsSubscriptionId: body.subscriptionId
                },
                update: {
                    plan: plan as Plan,
                    status: String(body.status),
                    lsCustomerId: userId,
                    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
                create: {
                    userId: userId,
                    lsSubscriptionId: body.subscriptionId,
                    plan: plan as Plan,
                    status: String(body.status),
                    lsCustomerId: userId,
                    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                }
            })

            return NextResponse.json({ success: true })
        }

        if (body.status === 'failure' || body.status === 'cancelled') {
            await prisma.user.update({
                where: { id: userId },
                data: { plan: 'FREE' }
            })

            await prisma.subscription.updateMany({
                where: { userId: userId },
                data: { status: 'cancelled' }
            })
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('Webhook processing error:', error)

        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}