// app/api/documents/[id]/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params

    const document = await prisma.document.findUnique({
        where: { id: id, userId: dbUser.id },
        include: { letters: { orderBy: { createdAt: 'desc' }, take: 1 } }
    })

    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    return NextResponse.json({
        document,
        plan: dbUser.plan
    })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { amount, date, invoiceNumber } = await req.json()
    const { id } = await params

    const currentDoc = await prisma.document.findUnique({
        where: { id: id, userId: dbUser.id }
    })
    if (!currentDoc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const currentExtracted = (currentDoc.extractedData as Record<string, string>) || {}

    const updatedDocument = await prisma.document.update({
        where: { id: id, userId: dbUser.id },
        data: {
            extractedData: {
                ...currentExtracted,
                amount,
                date,
                invoiceNumber,
            }
        }
    })

    return NextResponse.json({ document: updatedDocument })
}