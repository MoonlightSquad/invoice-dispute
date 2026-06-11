// app/api/letters/send/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Функція-шаблон для гарного HTML листа
function generateEmailTemplate(content: string, subject: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" id="email-container" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                        
                        <tr>
                            <td height="6" style="background-color: #4f46e5; font-size: 0; line-height: 0;"></td>
                        </tr>

                        <tr>
                            <td style="padding: 32px 32px 20px 32px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td>
                                            <span style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.025em;">
                                                Moonlight <span style="color: #4f46e5;">Resolve</span>
                                            </span>
                                        </td>
                                        <td align="right">
                                            <span style="font-size: 12px; font-weight: 500; color: #64748b; background-color: #f1f5f9; padding: 4px 10px; border-radius: 9999px;">
                                                Official Notice
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 0 32px;">
                                <div style="border-top: 1px solid #f1f5f9;"></div>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 32px; color: #334155; font-size: 15px; line-height: 1.6;">
                                <!-- pre-wrap магічно зберігає всі переноси рядків від LLM -->
                                <div style="white-space: pre-wrap; font-family: inherit; color: #334155;">${content}</div>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 0 32px;">
                                <div style="border-top: 1px solid #f1f5f9;"></div>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 24px 32px; background-color: #fafafa; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                    This dispute resolution letter was generated and delivered securely via 
                                    <a href="https://yourdomain.com" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Moonlight IT Platforms</a>.
                                </p>
                                <p style="margin: 6px 0 0 0; font-size: 11px; color: #cbd5e1;">
                                    If you received this email by mistake, please contact the sender directly.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `
}

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

    const { letterId, toEmail, subject } = await req.json()

    if (!letterId || !toEmail || !subject) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    try {
        const letter = await prisma.letter.findUnique({
            where: { id: letterId },
            include: { document: true }
        })

        if (!letter || letter.document.userId !== dbUser.id) {
            return NextResponse.json({ error: 'Letter not found or access denied' }, { status: 404 })
        }

        const htmlTemplate = generateEmailTemplate(letter.content, subject)

        const emailResponse = await resend.emails.send({
            from: 'Moonlight Resolve <onboarding@resend.dev>',
            to: [toEmail],
            subject: subject,
            html: htmlTemplate,
            tags: [
                {
                    name: 'letterId',
                    value: letterId
                }
            ]
        })

        if (emailResponse.error) {
            console.error('Resend API Error:', emailResponse.error)
            throw new Error('Failed to send email via Resend')
        }

        const updatedLetter = await prisma.letter.update({
            where: { id: letterId },
            data: { status: 'SENT' }
        })

        return NextResponse.json({ success: true, letter: updatedLetter })
    } catch (error) {
        console.error('Email Delivery Error:', error)
        return NextResponse.json({ error: 'email_delivery_failed' }, { status: 500 })
    }
}