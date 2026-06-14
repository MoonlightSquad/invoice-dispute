import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PublicPaymentClient from './PublicPaymentClient'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function PublicPaymentPage({ params }: PageProps) {
    const { id } = await params

    const document = await prisma.document.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            pdfUrl: true,
            extractedData: true,
        }
    })

    if (!document) {
        notFound()
    }

    const ext = (document.extractedData as Record<string, any>) || {}

    if (!ext.iban) {
        notFound()
    }

    const paymentData = {
        id: document.id,
        pdfUrl: document.pdfUrl,
        invoiceNumber: ext.invoiceNumber || '',
        date: ext.date || '',
        amount: ext.amount || '',
        iban: ext.iban || '',
        edrpou: ext.edrpou || '',
        swiftBic: ext.swiftBic || '',
        bankName: ext.bankName || '',
        paymentPurpose: ext.paymentPurpose || '',
        senderCompany: ext.senderCompany || ext.senderName || 'Beneficiary'
    }

    return <PublicPaymentClient data={paymentData} />
}