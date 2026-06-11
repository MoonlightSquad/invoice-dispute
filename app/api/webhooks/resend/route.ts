// app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text()

        const headerId = req.headers.get('svix-id') || req.headers.get('webhook-id')
        const headerTimestamp = req.headers.get('svix-timestamp') || req.headers.get('webhook-timestamp')
        const headerSignature = req.headers.get('svix-signature') || req.headers.get('webhook-signature')

        if (!headerId || !headerTimestamp || !headerSignature) {
            return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 })
        }

        const signedContent = `${headerId}.${headerTimestamp}.${rawBody}`

        const secretKey = RESEND_WEBHOOK_SECRET.startsWith('whsec_')
            ? RESEND_WEBHOOK_SECRET.substring(6)
            : RESEND_WEBHOOK_SECRET

        const computedSignature = crypto
            .createHmac('sha256', Buffer.from(secretKey, 'base64'))
            .update(signedContent)
            .digest('base64')

        const signatures = headerSignature.split(' ').map(s => {
            return s.includes(',') ? s.split(',')[1] : s
        })

        const isSignatureValid = signatures.includes(computedSignature)

        if (!isSignatureValid) {
            console.error('Webhook signature verification failed.')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const payload = JSON.parse(rawBody)
        const eventType = payload.type

        const letterId = payload.data?.tags?.letterId

        if (!letterId) {
            return NextResponse.json({ message: 'No letterId found in tags, ignoring' }, { status: 200 })
        }

        await prisma.emailEvent.create({
            data: {
                letterId: letterId,
                eventType: eventType,
                occurredAt: new Date(payload.created_at || Date.now())
            }
        })

        if (eventType === 'email.opened') {
            await prisma.letter.update({
                where: { id: letterId },
                data: {
                    status: 'OPENED'
                }
            })
            console.log(`Letter ${letterId} status updated to OPENED successfully.`)
        }

        return NextResponse.json({ received: true }, { status: 200 })

    } catch (error) {
        console.error('Resend Webhook Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}