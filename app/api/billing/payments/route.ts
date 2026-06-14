// app/api/billing/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as Sentry from "@sentry/nextjs";

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const subscriptionId = searchParams.get('subscriptionId')
        const page = searchParams.get('page') || '1'
        const limit = '5'

        if (!subscriptionId) {
            return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
        }

        const dateFrom = encodeURIComponent('2025-01-01T00:00:00Z')
        const url = `https://api.monobank.ua/api/merchant/subscription/payments?subscriptionId=${subscriptionId}&page=${page}&limit=${limit}&dateFrom=${dateFrom}`

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Token': process.env.MONO_API_KEY!,
                'Content-Type': 'application/json',
            }
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Monobank Payments Error:', data)
            return NextResponse.json({ payments: [] })
        }

        const paymentsArray = Array.isArray(data) ? data : (data.payments || [])
        const hasMore = paymentsArray.length === Number(limit)

        return NextResponse.json({
            payments: paymentsArray,
            hasMore
        })

    } catch (error) {
        Sentry.captureException(error)

        return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }
}