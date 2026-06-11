import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {PDFParse} from 'pdf-parse';

export async function POST(req: NextRequest) {
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

    const LIMITS = { FREE: 3, STARTER: 30, PRO: Infinity }
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const usedThisMonth = await prisma.document.count({
        where: { userId: dbUser.id, createdAt: { gte: startOfMonth } },
    })
    if (usedThisMonth >= LIMITS[dbUser.plan]) {
        return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'file_too_large' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let extractedData: Record<string, string> = {}

    try {
        const parser = new PDFParse({ data: new Uint8Array(buffer) })

        const parsed = await parser.getText()
        extractedData = extractInvoiceData(parsed.text)

        await parser.destroy()
    } catch (error) {
        console.error('Помилка парсингу PDF:', error)
    }

    // Зберігаємо в Supabase Storage
    const fileName = `${dbUser.id}/${Date.now()}-${file.name}`
    const { error: storageError } = await supabase.storage
        .from('invoices')
        .upload(fileName, buffer, { contentType: 'application/pdf' })

    if (storageError) {
        console.log(storageError)
        return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName)

    const document = await prisma.document.create({
        data: {
            userId: dbUser.id,
            title: file.name.replace('.pdf', ''),
            pdfUrl: publicUrl,
            extractedData,
        },
    })

    return NextResponse.json({ document })
}

export async function GET(req: NextRequest) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const documents = await prisma.document.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        include: { letters: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })

    return NextResponse.json({ documents })
}

function extractInvoiceData(text: string): Record<string, string> {
    const data: Record<string, string> = {}

    const amountMatch = text.match(/(?:total|amount|sum|due)[:\s]*\$?([\d,]+\.?\d{0,2})/i)
    if (amountMatch) data.amount = amountMatch[1]

    const dateMatch = text.match(/(?:date|issued|invoice date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i)
    if (dateMatch) data.date = dateMatch[1]

    const invoiceMatch = text.match(/(?:invoice\s*#?|inv\s*#?)[:\s]*([A-Z0-9\-]+)/i)
    if (invoiceMatch) data.invoiceNumber = invoiceMatch[1]

    data.rawText = text.slice(0, 2000)

    return data
}