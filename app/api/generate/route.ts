import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as Sentry from "@sentry/nextjs";

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

    const {
        documentId,
        situation,
        tone,
        type,
        letterLang,
        senderName,
        senderCompany,
        senderEmail,
        senderPhone,
        recipientName,
        recipientAddress,
        paymentUrl // Приймаємо нове посилання з фронтенду
    } = await req.json()

    const document = await prisma.document.findUnique({
        where: { id: documentId, userId: dbUser.id }
    })
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const extracted = (document.extractedData as Record<string, string>) || {}

    // BACKEND ENFORCEMENT: Перевіряємо тарифний план користувача
    const currentPlan = dbUser.plan || 'FREE'
    const finalTone = currentPlan === 'FREE' ? 'business' : tone

    const targetLanguageName = letterLang === 'uk' ? 'Ukrainian' : 'English'

    const systemPrompt = `You are an expert legal and business assistant helping a freelancer or small business resolve an invoice or payment issue.
        Generate a professional letter based on the provided details.
        
        CRITICAL LANGUAGE REQUIREMENT:
        The entire letter MUST be written strictly in the ${targetLanguageName} language. Do not use any other language under any circumstances.
        
        CRITICAL INSTRUCTIONS:
        1. Write a complete, professional, ready-to-send letter or email body.
        2. Use the provided SENDER and RECIPIENT info. If any specific data is "Not specified", only then use professional placeholders like [Your Name], [Company Name], etc.
        3. Do NOT hallucinate fake emails, phone numbers, or addresses if they are not provided.
        4. PAYMENT LINK INTEGRATION: If a PAYMENT HUB LINK is provided and is not "Not specified", you MUST naturally integrate it into the letter text (usually near the end or as a separate clear call-to-action paragraph). 
           - For Ukrainian: Write something professional like "Для швидкої та зручної оплати в один клік (карткою, через IBAN або QR-код) ви можете скористатися цим посиланням: [PAYMENT_URL]"
           - For English: Write something professional like "For a quick and secure one-click payment via card, IBAN, or QR code, please use the following secure payment link: [PAYMENT_URL]"
           Replace [PAYMENT_URL] with the actual URL string provided. If the link is "Not specified", do not mention any payment links at all.
        5. Return ONLY the text of the letter. Do not include any introductions, markdown commentary, or conversational filler.`

    const userPrompt = `LETTER TYPE: ${type}
        TONE: ${finalTone}
        TARGET LANGUAGE: ${targetLanguageName}
        
        SENDER INFO (YOU):
        - Name: ${senderName || 'Not specified'}
        - Company: ${senderCompany || 'Not specified'}
        - Email: ${senderEmail || 'Not specified'}
        - Phone: ${senderPhone || 'Not specified'}

        RECIPIENT INFO (CLIENT/DEBTOR):
        - Name: ${recipientName || 'Not specified'}
        - Address: ${recipientAddress || 'Not specified'}

        INVOICE DATA:
        - Invoice Number: ${extracted.invoiceNumber || 'Not specified'}
        - Date: ${extracted.date || 'Not specified'}
        - Amount Due: ${extracted.amount || 'Not specified'}
        
        PAYMENT HUB LINK (CTA):
        - URL: ${paymentUrl || 'Not specified'}
        
        USER SITUATION:
        "${situation}"
        
        RAW TEXT FOR CONTEXT:
        "${extracted.rawText || ''}"
    `

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
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.4,
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Groq API Error Details:', errorData)
            throw new Error('Groq API failed')
        }

        const aiData = await response.json()
        const letterContent = aiData.choices?.[0]?.message?.content

        if (!letterContent) {
            throw new Error('Empty response from Groq')
        }

        const letter = await prisma.letter.create({
            data: {
                documentId: document.id,
                tone: finalTone.toUpperCase() as any,
                type: type.toUpperCase() as any,
                content: letterContent,
                status: 'DRAFT',
                situation: situation,
                partyDetails: {
                    senderName,
                    senderCompany,
                    senderEmail,
                    senderPhone,
                    recipientName,
                    recipientAddress
                }
            }
        })

        return NextResponse.json({ letter })
    } catch (error) {
        Sentry.captureException(error)

        return NextResponse.json({ error: 'generation_failed' }, { status: 500 })
    }
}