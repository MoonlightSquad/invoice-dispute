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
        senderName?: string
        senderCompany?: string
        senderEmail?: string
        senderPhone?: string
        recipientName?: string
        recipientAddress?: string
        // Нові платіжні поля
        iban?: string
        edrpou?: string
        swiftBic?: string
        bankName?: string
        paymentPurpose?: string
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

    // Нові стейти для фінансових реквізитів
    const [iban, setIban] = useState('')
    const [edrpou, setEdrpou] = useState('')
    const [swiftBic, setSwiftBic] = useState('')
    const [bankName, setBankName] = useState('')
    const [paymentPurpose, setPaymentPurpose] = useState('')

    const [situation, setSituation] = useState('')
    const [tone, setTone] = useState('business')
    const [type, setType] = useState('claim')
    const [letterLang, setLetterLang] = useState(lang)

    const [letterId, setLetterId] = useState<string | null>(null)
    const [letterContent, setLetterContent] = useState('')
    const [letterStatus, setLetterStatus] = useState('DRAFT')

    const [toEmail, setToEmail] = useState('')
    const [emailSubject, setEmailSubject] = useState('')

    // Локалізація кастомних текстових елементів
    const txtUpgradeRequired = lang === 'uk' ? 'Відправка листів недоступна на безкоштовному тарифі.' : 'Sending emails is not available on the free plan.'
    const txtBtnPaidOnly = lang === 'uk' ? '🔒 Доступно у платних тарифах' : '🔒 Available in paid plans'
    const txtNoticePaidOnly = lang === 'uk' ? 'Пряма відправка email доступна лише для тарифів Starter та Pro.' : 'Direct email delivery is only available for Starter and Pro plans.'
    const txtLetterLangLabel = lang === 'uk' ? 'Мова листа' : 'Letter Language'

    const txtPaymentWidgetTitle = lang === 'uk' ? '🇺🇦 Швидка оплата (UA)' : '🌐 International Wire / SEPA'
    const txtPaymentWidgetDesc = lang === 'uk' ? 'Реквізити автоматично очищені від сміття' : 'Payment details extracted and cleaned'
    const txtCopyCleanIban = lang === 'uk' ? 'Чистий IBAN скопійовано!' : 'Clean IBAN copied successfully!'

    useEffect(() => {
        async function fetchDocument() {
            try {
                const res = await fetch(`/api/documents/${id}`)
                if (!res.ok) throw new Error()
                const data = await res.json()

                setDocument(data.document)
                const plan = data.plan || 'FREE'
                setUserPlan(plan)

                const ext = data.document.extractedData || {}
                setAmount(ext.amount || '')
                setDate(ext.date || '')
                setInvoiceNumber(ext.invoiceNumber || '')
                setSenderName(ext.senderName || '')
                setSenderCompany(ext.senderCompany || '')
                setSenderEmail(ext.senderEmail || '')
                setSenderPhone(ext.senderPhone || '')
                setRecipientName(ext.recipientName || '')
                setRecipientAddress(ext.recipientAddress || '')

                // Наповнення нових фінансових полів з бекенду
                setIban(ext.iban || '')
                setEdrpou(ext.edrpou || '')
                setSwiftBic(ext.swiftBic || '')
                setBankName(ext.bankName || '')
                setPaymentPurpose(ext.paymentPurpose || (ext.invoiceNumber ? `Payment for invoice No ${ext.invoiceNumber}` : ''))

                setEmailSubject(`${dict.app.documentView.subjectPrefix} ${ext.invoiceNumber || ''}`)

                if (data.document.letters?.length > 0) {
                    const lastLetter = data.document.letters[0]
                    setLetterId(lastLetter.id)
                    setLetterContent(lastLetter.content)
                    setLetterStatus(lastLetter.status)
                    setType(lastLetter.type.toLowerCase())
                    setTone(plan === 'FREE' ? 'business' : lastLetter.tone.toLowerCase())
                    setSituation(lastLetter.situation || '')

                    const details = lastLetter.partyDetails || {}
                    if (details.senderName) setSenderName(details.senderName)
                    if (details.senderCompany) setSenderCompany(details.senderCompany)
                    if (details.senderEmail) setSenderEmail(details.senderEmail)
                    if (details.senderPhone) setSenderPhone(details.senderPhone)
                    if (details.recipientName) setRecipientName(details.recipientName)
                    if (details.recipientAddress) setRecipientAddress(details.recipientAddress)
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
                body: JSON.stringify({
                    amount,
                    date,
                    invoiceNumber,
                    senderName,
                    senderCompany,
                    senderEmail,
                    senderPhone,
                    recipientName,
                    recipientAddress,
                    // Передаємо нові поля на збереження
                    iban,
                    edrpou,
                    swiftBic,
                    bankName,
                    paymentPurpose
                })
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
            // Публічний лінк на оплату, який ми згенеруємо для вшивання в лист
            const paymentUrl = `${window.location.origin}/pay/${id}`

            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: id,
                    situation,
                    tone: userPlan === 'FREE' ? 'business' : tone,
                    type,
                    letterLang,
                    senderName,
                    senderCompany,
                    senderEmail,
                    senderPhone,
                    recipientName,
                    recipientAddress,
                    // Передаємо посилання в ШІ промпт генерації листа
                    paymentUrl
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
        if (userPlan === 'FREE') {
            toast.error(txtUpgradeRequired)
            return
        }

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

            if (!res.ok) {
                throw new Error(data.error || 'Failed')
            }

            setLetterStatus('SENT')
            toast.success(dict.app.documentView.toasts.sendSuccess)
        } catch (err: any) {
            console.error(err)
            if (err.message === 'upgrade_required') {
                toast.error(txtUpgradeRequired)
            } else {
                toast.error(err.message || 'Failed to send email.')
            }
        } finally {
            setSendingEmail(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(letterContent)
        toast.success(dict.app.documentView.toasts.copied)
    }

    // Розрахунок стандартизованого тексту для QR-коду (стандарт EPC/НБУ)
    const getQrCodeValue = () => {
        if (!iban) return ''
        const cleanAmount = amount.replace(/[^0-9.]/g, '') // Залишаємо суто числове значення
        const cleanIban = iban.replace(/\s+/g, '')
        const currency = cleanIban.startsWith('UA') ? 'UAH' : 'EUR'

        return [
            "BCD",
            "002",
            "1",
            "SCT",
            swiftBic || "",
            senderCompany || bankName || "Beneficiary",
            cleanIban,
            cleanAmount ? `${currency}${cleanAmount}` : "",
            "",
            "",
            paymentPurpose || `Invoice ${invoiceNumber}`,
            ""
        ].join("\n")
    }

    const qrValue = getQrCodeValue()
    const isInternational = !!swiftBic || (iban && !iban.startsWith('UA'))

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
                {/* ЛІВА КОЛОНКА (Документ + Оплата) */}
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">{dict.app.documentView.extractedTitle}</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.invoiceNumber}</label>
                                    <input
                                        type="text"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.invoiceDate}</label>
                                    <input
                                        type="text"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.amountDue}</label>
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-indigo-500 font-semibold text-slate-900"
                                />
                            </div>

                            {/* Нові інпути фінансових реквізитів для коригування */}
                            <div className="border-t border-slate-100 pt-4 space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Платіжні реквізити</h4>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">IBAN</label>
                                    <input
                                        type="text"
                                        value={iban}
                                        onChange={(e) => setIban(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono tracking-wider focus:outline-indigo-500"
                                        placeholder="UA00000..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                            {iban.startsWith('UA') || !iban ? 'ЄДРПОУ / ІПН' : 'SWIFT / BIC'}
                                        </label>
                                        <input
                                            type="text"
                                            value={iban.startsWith('UA') || !iban ? edrpou : swiftBic}
                                            onChange={(e) => iban.startsWith('UA') || !iban ? setEdrpou(e.target.value) : setSwiftBic(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Банк отримувача</label>
                                        <input
                                            type="text"
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Призначення платежу</label>
                                    <input
                                        type="text"
                                        value={paymentPurpose}
                                        onChange={(e) => setPaymentPurpose(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-indigo-500"
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

                    {/* БЛОК ШВИДКОЇ ОПЛАТИ (PAYMENT HUB WIDGET) */}
                    {iban && (
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold tracking-wide uppercase text-indigo-300">
                                        {isInternational ? '🌐 International Wire / SEPA' : txtPaymentWidgetTitle}
                                    </h3>
                                    <p className="text-[11px] text-slate-400">{txtPaymentWidgetDesc}</p>
                                </div>
                                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-500/30">
                                    Pay Hub
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <div className="md:col-span-2 space-y-3 text-xs">
                                    <div>
                                        <span className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">Beneficiary IBAN</span>
                                        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10">
                                            <code className="font-mono text-white tracking-wider truncate flex-1">{iban}</code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(iban.replace(/\s+/g, ''))
                                                    toast.success(txtCopyCleanIban)
                                                }}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded text-[10px] font-medium transition shrink-0"
                                            >
                                                {lang === 'uk' ? 'Копіювати' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {!isInternational && edrpou && (
                                            <div>
                                                <span className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">ЄДРПОУ</span>
                                                <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10 font-mono">
                                                    <span>{edrpou}</span>
                                                    <button onClick={() => { navigator.clipboard.writeText(edrpou); toast.success('ЄДРПОУ скопійовано') }} className="text-indigo-400 hover:text-white text-[10px]">{lang === 'uk' ? 'Копія' : 'Copy'}</button>
                                                </div>
                                            </div>
                                        )}
                                        {isInternational && swiftBic && (
                                            <div>
                                                <span className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">SWIFT / BIC</span>
                                                <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10 font-mono">
                                                    <span className="truncate">{swiftBic}</span>
                                                    <button onClick={() => { navigator.clipboard.writeText(swiftBic); toast.success('SWIFT скопійовано') }} className="text-indigo-400 hover:text-white text-[10px]">{lang === 'uk' ? 'Копія' : 'Copy'}</button>
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <span className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">Сума</span>
                                            <div className="bg-white/5 rounded-lg p-2 border border-white/10 font-bold text-emerald-400 font-mono truncate">
                                                {amount || '—'}
                                            </div>
                                        </div>
                                    </div>

                                    {paymentPurpose && (
                                        <div>
                                            <span className="block text-slate-400 text-[10px] uppercase font-semibold mb-0.5">Призначення</span>
                                            <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-slate-300 italic text-[11px] line-clamp-1 hover:line-clamp-none transition-all">
                                                {paymentPurpose}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-center justify-center bg-white p-2 rounded-xl border border-white/10 shrink-0">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(qrValue)}`}
                                        alt="Payment QR Code"
                                        className="w-24 h-24"
                                    />
                                    <span className="text-[9px] text-slate-600 font-medium mt-1 text-center leading-tight">
                                        {lang === 'uk' ? 'Скануй у банк-клієнт' : 'Scan via banking app'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-[540px]">
                        <iframe src={`${document?.pdfUrl}#toolbar=0`} className="w-full h-full border-none" title="Invoice PDF Preview" />
                    </div>
                </div>

                {/* ПРАВА КОЛОНКА (Генерація текстів та Email) */}
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">{dict.app.documentView.generateTitle}</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.letterType}</label>
                                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-indigo-500 bg-white">
                                        <option value="claim">{dict.app.documentView.types.claim}</option>
                                        <option value="response">{dict.app.documentView.types.response}</option>
                                        <option value="reminder">{dict.app.documentView.types.reminder}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                        {dict.app.documentView.tone} {userPlan === 'FREE' ? '🔒' : ''}
                                    </label>
                                    <select
                                        value={userPlan === 'FREE' ? 'business' : tone}
                                        onChange={(e) => setTone(e.target.value)}
                                        disabled={userPlan === 'FREE'}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    >
                                        <option value="business">{dict.app.documentView.tones.business}</option>
                                        <option value="friendly">{dict.app.documentView.tones.friendly}</option>
                                        <option value="legal">{dict.app.documentView.tones.legal}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{txtLetterLangLabel}</label>
                                    <select value={letterLang} onChange={(e) => setLetterLang(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-indigo-500 bg-white">
                                        <option value="uk">Українська</option>
                                        <option value="en">English</option>
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

                            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
                                <h3 className="text-md font-semibold text-slate-900">{dict.app.documentView.sendEmailTitle}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.recipientEmail}</label>
                                        <input
                                            type="email"
                                            disabled={userPlan === 'FREE'}
                                            value={toEmail}
                                            onChange={(e) => setToEmail(e.target.value)}
                                            placeholder={dict.app.documentView.placeholderEmail}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{dict.app.documentView.emailSubject}</label>
                                        <input
                                            type="text"
                                            disabled={userPlan === 'FREE'}
                                            value={emailSubject}
                                            onChange={(e) => setEmailSubject(e.target.value)}
                                            placeholder={dict.app.documentView.placeholderSubject}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={sendingEmail || userPlan === 'FREE'}
                                    className={`w-full font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                                        userPlan === 'FREE'
                                            ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                    }`}
                                >
                                    {sendingEmail ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {dict.app.documentView.btnSending}
                                        </>
                                    ) : userPlan === 'FREE' ? (
                                        txtBtnPaidOnly
                                    ) : (
                                        dict.app.documentView.btnSend
                                    )}
                                </button>
                                <p className="text-[11px] text-slate-400 text-center">
                                    {userPlan === 'FREE' ? txtNoticePaidOnly : dict.app.documentView.resendNotice}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}