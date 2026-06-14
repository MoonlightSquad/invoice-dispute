import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractText } from 'unpdf'
import * as Sentry from "@sentry/nextjs";

// Функція для інтелектуального аналізу тексту через Groq
async function extractInvoiceDataWithGroq(text: string): Promise<Record<string, string>> {
    const defaultData = {
        amount: '',
        date: '',
        invoiceNumber: '',
        senderName: '',
        senderCompany: '',
        senderEmail: '',
        senderPhone: '',
        recipientName: '',
        recipientAddress: '',
        // Нові поля для платіжного хабу
        iban: '',
        edrpou: '',
        swiftBic: '',
        bankName: '',
        paymentPurpose: ''
    }

    if (!process.env.GROQ_API_KEY) {
        console.error('Groq API key is missing in environment variables.')
        return defaultData
    }

    const cleanText = text.slice(0, 6000)

    const systemPrompt = `You are an expert AI data extraction assistant. Your job is to analyze raw text extracted from financial documents (such as international invoices, Ukrainian invoices/рахунки-фактури, acts of completed works/акти виконаних робіт, or receipts) and extract core fields.

    Carefully identify the Sender (Issuer/Seller/Provider/Виконавець/Постачальник) and the Recipient (Client/Buyer/Customer/Замовник/Покупець).

    You must extract the following fields into a single JSON object:
    1. "invoiceNumber": The document identifier/number (e.g., "INV-2026-001", "№ 124/а").
    2. "date": The date the document was issued.
    3. "amount": The final total amount due/payable including currency (e.g., "1,500.00 USD", "45000 грн").
    4. "senderName": Full name of the contact person from the sending party (if available).
    5. "senderCompany": Company name of the sender/provider (e.g., "ТОВ Ромашка", "Acme Corp").
    6. "senderEmail": Email address of the sender.
    7. "senderPhone": Phone number of the sender.
    8. "recipientName": Full name of the contact person or company name of the recipient party.
    9. "recipientAddress": Physical or registration address of the recipient.
    
    NEW FINANCIAL FIELDS FOR PAYMENT GENERATION:
    10. "iban": International Bank Account Number. For Ukrainian invoices it starts with 'UA' followed by 27 digits. For EU/International it follows standard local bank account IBAN formats. Extract without modifying characters.
    11. "edrpou": Ukrainian company identification tax code / ЄДРПОУ (8 digits for legal entities, 10 digits for individual entrepreneurs/ФОП). Leave empty for non-Ukrainian documents.
    12. "swiftBic": SWIFT/BIC code used for international bank wire transfers.
    13. "bankName": Full name of the beneficiary's bank (e.g., "АТ КБ ПРИВАТБАНК", "Revolut Bank Ltd").
    14. "paymentPurpose": Construct or extract the payment description/reference (e.g., "Payment for IT services according to Invoice No 124").

    CRITICAL REQUIREMENT:
    - You must respond ONLY with a valid JSON object matching the keys specified above.
    - Do not include markdown blocks (\`\`\`json), introduction, or explanations.
    - If a specific field cannot be found or determined, return an empty string "" for its value.`

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Document raw text:\n\"\"\"\n${cleanText}\n\"\"\"` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
            })
        })

        if (!response.ok) {
            throw new Error(`Groq API responded with status ${response.status}`)
        }

        const result = await response.json()
        const jsonString = result.choices?.[0]?.message?.content

        if (jsonString) {
            const parsedJson = JSON.parse(jsonString)
            return {
                amount: String(parsedJson.amount || ''),
                date: String(parsedJson.date || ''),
                invoiceNumber: String(parsedJson.invoiceNumber || ''),
                senderName: String(parsedJson.senderName || ''),
                senderCompany: String(parsedJson.senderCompany || ''),
                senderEmail: String(parsedJson.senderEmail || ''),
                senderPhone: String(parsedJson.senderPhone || ''),
                recipientName: String(parsedJson.recipientName || ''),
                recipientAddress: String(parsedJson.recipientAddress || ''),
                // Мапінг нових полів
                iban: String(parsedJson.iban || '').replace(/\s+/g, ''), // Одразу чистимо від випадкових пробілів
                edrpou: String(parsedJson.edrpou || '').trim(),
                swiftBic: String(parsedJson.swiftBic || '').trim(),
                bankName: String(parsedJson.bankName || '').trim(),
                paymentPurpose: String(parsedJson.paymentPurpose || '').trim(),
            }
        }
    } catch (error) {
        console.error('Помилка при екстракції даних через Groq:', error)
        Sentry.captureException(error)
    }

    return defaultData
}

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
            const parsed = await extractText(new Uint8Array(arrayBuffer))
            const pdfText = Array.isArray(parsed.text)
                ? parsed.text.join('\n')
                : (parsed.text || '')

            const groqFields = await extractInvoiceDataWithGroq(pdfText)

            extractedData = {
                ...groqFields,
                rawText: pdfText.slice(0, 4000)
            }
        } catch (error) {
            console.error('Помилка парсингу PDF:', error)
            Sentry.captureException(error)
            extractedData = {
                amount: '', date: '', invoiceNumber: '', rawText: '',
                iban: '', edrpou: '', swiftBic: '', bankName: '', paymentPurpose: ''
            }
        }

        const sanitizedName = file.name
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9._-]/g, '')

        const fileName = `${dbUser.id}/${Date.now()}-${sanitizedName}`

        const { error: storageError } = await supabase.storage
            .from('invoices')
            .upload(fileName, file, {
                contentType: 'application/pdf',
                upsert: true
            })

        if (storageError) {
            console.error('Supabase Storage Error:', storageError)
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
    } catch (error) {
        Sentry.captureException(error)

        return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }
}

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

        const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
        if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const documents = await prisma.document.findMany({
            where: { userId: dbUser.id },
            orderBy: { createdAt: 'desc' },
            include: { letters: { orderBy: { createdAt: 'desc' }, take: 1 } },
        })

        return NextResponse.json({ documents })
    } catch (error) {
        Sentry.captureException(error)

        return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }
}