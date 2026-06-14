'use client'

import { useState } from 'react'

interface PaymentData {
    id: string
    pdfUrl: string
    invoiceNumber: string
    date: string
    amount: string
    iban: string
    edrpou: string
    swiftBic: string
    bankName: string
    paymentPurpose: string
    senderCompany: string
}

export default function PublicPaymentClient({ data }: { data: PaymentData }) {
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const isUa = data.iban.toUpperCase().startsWith('UA')
    const cleanAmount = data.amount.replace(/[^0-9.]/g, '')
    const currency = isUa ? 'UAH' : 'EUR'

    const qrValue = [
        "BCD",
        "002",
        "1",
        "SCT",
        data.swiftBic || "",
        data.senderCompany,
        data.iban.replace(/\s+/g, ''),
        cleanAmount ? `${currency}${cleanAmount}` : "",
        "",
        "",
        data.paymentPurpose || `Invoice ${data.invoiceNumber}`,
        ""
    ].join("\n")

    const handleCopy = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text.replace(/\s+/g, ''))
        setCopiedField(fieldName)
        setTimeout(() => setCopiedField(null), 2000)
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased">
            {/* Шляпка хабу */}
            <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse" />
                        <span className="text-md font-bold text-slate-900 tracking-tight">
                            Moonlight <span className="text-indigo-600">PayHub</span>
                        </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1">
                        🔒 Secure Secure SSL Connection
                    </span>
                </div>
            </header>

            <main className="max-w-5xl w-full mx-auto p-4 md:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                <div className="lg:col-span-7 space-y-6">

                    {/* Картка суми */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {isUa ? 'До сплати' : 'Amount Due'}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-mono text-emerald-600">
                            {data.amount || '—'}
                        </h1>

                        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 text-xs">
                            <div>
                                <span className="text-slate-400 block mb-0.5">{isUa ? 'Отримувач' : 'Beneficiary'}</span>
                                <span className="font-semibold text-slate-800 text-sm">{data.senderCompany}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5">{isUa ? 'Рахунок / Інвойс' : 'Invoice Number'}</span>
                                <span className="font-mono font-bold text-slate-800 text-sm">#{data.invoiceNumber || '—'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                            {isUa ? 'Банківські реквізити' : 'Wire Transfer Details'}
                        </h3>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[11px] font-bold text-slate-400 uppercase">IBAN</label>
                                {copiedField === 'iban' && <span className="text-[11px] text-emerald-600 font-medium">✓ {isUa ? 'Скопійовано' : 'Copied'}</span>}
                            </div>
                            <div
                                onClick={() => handleCopy(data.iban, 'iban')}
                                className="group flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs md:text-sm tracking-wider text-slate-800 cursor-pointer hover:bg-indigo-50/40 hover:border-indigo-200 transition"
                            >
                                <span className="truncate pr-2 font-bold select-all">{data.iban}</span>
                                <span className="text-[11px] text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition shrink-0">
                                    {isUa ? 'Копіювати' : 'Copy'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {isUa && data.edrpou && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase">ЄДРПОУ / ІПН</label>
                                        {copiedField === 'edrpou' && <span className="text-[11px] text-emerald-600 font-medium">✓ OK</span>}
                                    </div>
                                    <div
                                        onClick={() => handleCopy(data.edrpou, 'edrpou')}
                                        className="group flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-sm text-slate-800 cursor-pointer hover:bg-indigo-50/40 hover:border-indigo-200 transition"
                                    >
                                        <span>{data.edrpou}</span>
                                        <span className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition">Copy</span>
                                    </div>
                                </div>
                            )}

                            {!isUa && data.swiftBic && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase">SWIFT / BIC</label>
                                        {copiedField === 'swift' && <span className="text-[11px] text-emerald-600 font-medium">✓ OK</span>}
                                    </div>
                                    <div
                                        onClick={() => handleCopy(data.swiftBic, 'swift')}
                                        className="group flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-sm text-slate-800 cursor-pointer hover:bg-indigo-50/40 hover:border-indigo-200 transition"
                                    >
                                        <span>{data.swiftBic}</span>
                                        <span className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition">Copy</span>
                                    </div>
                                </div>
                            )}

                            {data.bankName && (
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">{isUa ? 'Банк' : 'Bank Name'}</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 truncate">
                                        {data.bankName}
                                    </div>
                                </div>
                            )}
                        </div>

                        {data.paymentPurpose && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase">{isUa ? 'Призначення платежу' : 'Payment Purpose'}</label>
                                    {copiedField === 'purpose' && <span className="text-[11px] text-emerald-600 font-medium">✓ OK</span>}
                                </div>
                                <div
                                    onClick={() => handleCopy(data.paymentPurpose, 'purpose')}
                                    className="group flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs md:text-sm text-slate-700 italic cursor-pointer hover:bg-indigo-50/40 hover:border-indigo-200 transition"
                                >
                                    <span className="truncate pr-2">{data.paymentPurpose}</span>
                                    <span className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition shrink-0">Copy</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">

                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-2xl p-6 shadow-md text-center flex flex-col items-center justify-center">
                        <div className="mb-2">
                            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-indigo-500/30 tracking-widest uppercase">
                                {isUa ? 'Скануй та оплачуй' : 'Scan to Pay'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4 leading-relaxed">
                            {isUa
                                ? 'Відкрийте ваш мобільний банк (Приват24, Monobank тощо) та відскануйте цей код для автоматичного заповнення всіх полів.'
                                : 'Open your banking or SEPA-supported application to scan and pay instantly.'}
                        </p>

                        <div className="bg-white p-3 rounded-2xl inline-block shadow-xl border border-white/10 my-2">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}`}
                                alt="Payment QR Code"
                                className="w-40 h-40 md:w-44 md:h-44"
                            />
                        </div>

                        <p className="text-[10px] text-slate-500 mt-3 font-mono">
                            EPC-QR / National Bank Compliant
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <a
                            href={data.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                        >
                            📄 {isUa ? 'Переглянути оригінальний рахунок (PDF)' : 'View Original Invoice PDF'}
                        </a>
                    </div>
                </div>
            </main>

            <footer className="bg-slate-100 border-t border-slate-200 py-4 text-center text-xs text-slate-400">
                <p>© {new Date().getFullYear()} Moonlight Resolve. All transaction parameters are end-to-end encrypted.</p>
            </footer>
        </div>
    )
}