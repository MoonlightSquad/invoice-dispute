// app/api/generate/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        senderName,
        senderCompany,
        senderEmail,
        senderPhone,
        recipientName,
        recipientAddress
    } = await req.json()

    const document = await prisma.document.findUnique({
        where: { id: documentId, userId: dbUser.id }
    })
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const extracted = (document.extractedData as Record<string, string>) || {}

    const systemPrompt = `You are an expert legal assistant helping a freelancer or small business resolve an invoice dispute.
        Generate a formal dispute letter based on the provided details.
        The letter must be written in the language appropriate to the context (if the situation or invoice is in Ukrainian, write in Ukrainian. If in English, write in English).
        
        CRITICAL INSTRUCTIONS:
        1. Write a complete, professional, ready-to-send letter.
        2. Use the provided SENDER and RECIPIENT info. If any specific data is "Not specified", only then use professional placeholders like [Your Name], [Company Name], etc.
        3. Do NOT hallucinate fake emails, phone numbers, or addresses if they are not provided.
        4. Return ONLY the text of the letter. Do not include any introductions, markdown commentary, or conversational filler.`

    const userPrompt = `LETTER TYPE: ${type}
        TONE: ${tone}
        
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
                tone: tone.toUpperCase() as any,
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
        console.error('Generation Error:', error)
        return NextResponse.json({ error: 'generation_failed' }, { status: 500 })
    }
}