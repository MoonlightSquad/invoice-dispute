'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getDictionary } from "@/lib/i18n"

interface DocumentData {
    id: string
    title: string
    pdfUrl: string
    extractedData: {
        amount?: string
        date?: string
        invoiceNumber?: string
        rawText?: string
    }
    letters: Array<{
        id: string
        content: string
        tone: string
        type: string
        status: string
        situation?: string | null
        partyDetails?: {
            senderName?: string
            senderCompany?: string
            senderEmail?: string
            senderPhone?: string
            recipientName?: string
            recipientAddress?: string
        } | null
    }>
}

export default function DocumentViewClient({ id, lang }: { id: string; lang: string }) {
    const router = useRouter()
    const dict = getDictionary(lang)

    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [savingFields, setSavingFields] = useState(false)
    const [sendingEmail, setSendingEmail] = useState(false)

    const [document, setDocument] = useState<DocumentData | null>(null)
    const [userPlan, setUserPlan] = useState<string>('FREE')

    const [amount, setAmount] = useState('')
    const [date, setDate] = useState('')
    const [invoiceNumber, setInvoiceNumber] = useState('')

    const [senderName, setSenderName] = useState('')
    const [senderCompany, setSenderCompany] = useState('')
    const [senderEmail, setSenderEmail] = useState('')
    const [senderPhone, setSenderPhone] = useState('')
    const [recipientName, setRecipientName] = useState('')
    const [recipientAddress, setRecipientAddress] = useState('')

    const [situation, setSituation] = useState('')
    const [tone, setTone] = useState('business')
    const [type, setType] = useState('claim')

    const [letterId, setLetterId] = useState<string | null>(null)
    const [letterContent, setLetterContent] = useState('')
    const [letterStatus, setLetterStatus] = useState('DRAFT')

    const [toEmail, setToEmail] = useState('')
    const [emailSubject, setEmailSubject] = useState('')

    useEffect(() => {
        async function fetchDocument() {
            try {
                const res = await fetch(`/api/documents/${id}`)
                if (!res.ok) throw new Error()
                const data = await res.json()

                setDocument(data.document)
                setUserPlan(data.plan || 'FREE')

                setAmount(data.document.extractedData?.amount || '')
                setDate(data.document.extractedData?.date || '')
                setInvoiceNumber(data.document.extractedData?.invoiceNumber || '')

                if (data.document.letters?.length > 0) {
                    const lastLetter = data.document.letters[0]
                    setLetterId(lastLetter.id)
                    setLetterContent(lastLetter.content)
                    setLetterStatus(lastLetter.status)
                    setTone(lastLetter.tone.toLowerCase())
                    setType(lastLetter.type.toLowerCase())

                    setSituation(lastLetter.situation || '')

                    const details = lastLetter.partyDetails || {}
                    setSenderName(details.senderName || '')
                    setSenderCompany(details.senderCompany || '')
                    setSenderEmail(details.senderEmail || '')
                    setSenderPhone(details.senderPhone || '')
                    setRecipientName(details.recipientName || '')
                    setRecipientAddress(details.recipientAddress || '')

                    setEmailSubject(`${dict.app.documentView.subjectPrefix} ${data.document.extractedData?.invoiceNumber || ''}`)
                }
            } catch {
                toast.error(dict.app.documentView.toasts.loadError)
                router.push('/dashboard')
            } finally {
                setLoading(false)
            }
        }
        fetchDocument()
    }, [id, router, dict])

    const handleSaveFields = async () => {
        setSavingFields(true)
        try {
            const res = await fetch(`/api/documents/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, date, invoiceNumber })
            })
            if (!res.ok) throw new Error()
            toast.success(dict.app.documentView.toasts.updateSuccess)
        } catch {
            toast.error(dict.app.documentView.toasts.updateError)
        } finally {
            setSavingFields(false)
        }
    }

    const handleGenerateLetter = async () => {
        if (!situation.trim()) {
            toast.error(dict.app.documentView.toasts.describeFirst)
            return
        }
        setGenerating(true)
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: id,
                    situation,
                    tone,
                    type,
                    senderName,
                    senderCompany,
                    senderEmail,
                    senderPhone,
                    recipientName,
                    recipientAddress
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error()

            setLetterId(data.letter.id)
            setLetterContent(data.letter.content)
            setLetterStatus(data.letter.status)

            setEmailSubject(`${dict.app.documentView.subjectPrefix} ${invoiceNumber || dict.app.documentView.subjectSpecification}`)
            toast.success(dict.app.documentView.toasts.generateSuccess)
        } catch {
            toast.error(dict.app.documentView.toasts.generateError)
        } finally {
            setGenerating(false)
        }
    }

    const handleSendEmail = async () => {
        if (!toEmail.trim()) {
            toast.error(dict.app.documentView.toasts.enterRecipient)
            return
        }
        if (!emailSubject.trim()) {
            toast.error(dict.app.documentView.toasts.enterSubject)
            return
        }

        setSendingEmail(true)
        try {
            const res = await fetch('/api/letters/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    letterId,
                    toEmail,
                    subject: emailSubject
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')

            setLetterStatus('SENT')
            toast.success(dict.app.documentView.toasts.sendSuccess)
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || 'Failed to send email.')
        } finally {
            setSendingEmail(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(letterContent)
        toast.success(dict.app.documentView.toasts.copied)
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 block">
                        {dict.app.documentView.back}
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">{document?.title}</h1>
                </div>
                <a
                    href={document?.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition"
                >
                    {dict.app.documentView.viewPdf}
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">{dict.app.documentView.extractedTitle}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.invoiceNumber}</label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.invoiceDate}</label>
                                    <input
                                        type="text"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.amountDue}</label>
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-indigo-500"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSaveFields}
                                disabled={savingFields}
                                className="w-full mt-2 bg-slate-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
                            >
                                {savingFields ? dict.app.documentView.btnSaving : dict.app.documentView.btnSaveChanges}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-[540px]">
                        <iframe src={`${document?.pdfUrl}#toolbar=0`} className="w-full h-full border-none" title="Invoice PDF Preview" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">{dict.app.documentView.generateTitle}</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.letterType}</label>
                                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-indigo-500 bg-white">
                                        <option value="claim">{dict.app.documentView.types.claim}</option>
                                        <option value="response">{dict.app.documentView.types.response}</option>
                                        <option value="reminder">{dict.app.documentView.types.reminder}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.tone}</label>
                                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-indigo-500 bg-white">
                                        <option value="business">{dict.app.documentView.tones.business}</option>
                                        <option value="friendly" disabled={userPlan === 'FREE'}>{dict.app.documentView.tones.friendly} {userPlan === 'FREE' ? '🔒' : ''}</option>
                                        <option value="legal" disabled={userPlan === 'FREE'}>{dict.app.documentView.tones.legal} {userPlan === 'FREE' ? '🔒' : ''}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{dict.app.documentView.partyDetails}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder={dict.app.documentView.placeholders.senderName} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500" />
                                    <input type="text" value={senderCompany} onChange={(e) => setSenderCompany(e.target.value)} placeholder={dict.app.documentView.placeholders.senderCompany} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder={dict.app.documentView.placeholders.senderEmail} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500" />
                                    <input type="text" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder={dict.app.documentView.placeholders.senderPhone} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder={dict.app.documentView.placeholders.recipientName} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500" />
                                    <input type="text" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder={dict.app.documentView.placeholders.recipientAddress} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.describeSituation}</label>
                                <textarea rows={3} value={situation} onChange={(e) => setSituation(e.target.value)} placeholder={dict.app.documentView.placeholderSituation} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-indigo-500 resize-none" />
                            </div>

                            <button onClick={handleGenerateLetter} disabled={generating} className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                                {generating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : dict.app.documentView.btnGenerate}
                            </button>
                        </div>
                    </div>

                    {letterContent && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold text-slate-900">{dict.app.documentView.resultingDraft}</h2>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${letterStatus === 'SENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                            {letterStatus}
                                        </span>
                                    </div>
                                    <button onClick={handleCopy} className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-3 py-1.5 rounded-lg font-medium transition">
                                        {dict.app.documentView.btnCopy}
                                    </button>
                                </div>

                                <textarea rows={10} value={letterContent} onChange={(e) => setLetterContent(e.target.value)} className="w-full border border-slate-200 rounded-xl p-4 text-sm font-sans text-slate-800 bg-slate-50 focus:bg-white focus:outline-indigo-500 transition" />
                            </div>

                            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                                <h3 className="text-md font-semibold text-slate-900">{dict.app.documentView.sendEmailTitle}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.recipientEmail}</label>
                                        <input
                                            type="email"
                                            value={toEmail}
                                            onChange={(e) => setToEmail(e.target.value)}
                                            placeholder={dict.app.documentView.placeholderEmail}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.emailSubject}</label>
                                        <input
                                            type="text"
                                            value={emailSubject}
                                            onChange={(e) => setEmailSubject(e.target.value)}
                                            placeholder={dict.app.documentView.placeholderSubject}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-indigo-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={sendingEmail}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {sendingEmail ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {dict.app.documentView.btnSending}
                                        </>
                                    ) : (
                                        dict.app.documentView.btnSend
                                    )}
                                </button>
                                <p className="text-[11px] text-slate-400 text-center">
                                    {dict.app.documentView.resendNotice}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}