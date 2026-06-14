'use client'

import { useState } from 'react'

interface SettingsFormProps {
    initialSettings: any
    userLang: string
    tgConnected: boolean
    tgToken?: string
}

export default function NotificationSettingsForm({ initialSettings, userLang, tgConnected, tgToken }: SettingsFormProps) {
    const [lang, setLang] = useState(userLang)
    const [settings, setSettings] = useState({
        inAppLetterViewed: initialSettings?.inAppLetterViewed ?? true,
        inAppPaymentClaimed: initialSettings?.inAppPaymentClaimed ?? true,
        emailLetterViewed: initialSettings?.emailLetterViewed ?? false,
        emailPaymentClaimed: initialSettings?.emailPaymentClaimed ?? true,
        tgLetterViewed: initialSettings?.tgLetterViewed ?? false,
        tgPaymentClaimed: initialSettings?.tgPaymentClaimed ?? true,
    })
    const [loading, setLoading] = useState(false)

    const handleToggle = (key: string) => {
        setSettings(p => ({ ...p, [key]: !p[key as keyof typeof p] }))
    }

    const saveSettings = async () => {
        setLoading(true)
        await fetch('/api/user/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lang, ...settings })
        })
        setLoading(false)
    }

    // Тексти інтерфейсу відповідно до обраної мови
    const t = {
        uk: {
            title: "Налаштування сповіщень",
            langLabel: "Мова інтерфейсу та сповіщень",
            ch1: "🔔 Внутрішні пуші (Дзвіночок)",
            ch2: "📧 Електронна пошта",
            ch3: "💬 Telegram Сповіщення",
            viewed: "Перегляд листа боржником",
            paid: "Декларація оплати боржником",
            tgBtnConnect: "Підключити Telegram Бота",
            tgStatusOk: "✓ Telegram успішно активовано",
            save: "Зберегти налаштування"
        },
        en: {
            title: "Notification Settings",
            langLabel: "Interface & Notification Language",
            ch1: "🔔 In-App Push (Bell)",
            ch2: "📧 Email Delivery",
            ch3: "💬 Telegram Notifications",
            viewed: "Letter viewed by debtor",
            paid: "Payment claimed by debtor",
            tgBtnConnect: "Connect Telegram Bot",
            tgStatusOk: "✓ Telegram active",
            save: "Save Settings"
        }
    }[lang === 'en' ? 'en' : 'uk']

    return (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 font-sans">
            <div>
                <h3 className="text-lg font-bold text-slate-900">{t.title}</h3>
            </div>


            <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">{t.langLabel}</label>
                <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none"
                >
                    <option value="uk">Українська (UA)</option>
                    <option value="en">English (EN)</option>
                </select>
            </div>

            <hr className="border-slate-100" />


            <div className="space-y-4">

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">{t.ch1}</h4>
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 text-xs text-slate-800 font-medium">
                            <input type="checkbox" checked={settings.inAppLetterViewed} onChange={() => handleToggle('inAppLetterViewed')} className="rounded border-slate-300 text-indigo-600" />
                            {t.viewed}
                        </label>
                        <label className="flex items-center gap-3 text-xs text-slate-800 font-medium">
                            <input type="checkbox" checked={settings.inAppPaymentClaimed} onChange={() => handleToggle('inAppPaymentClaimed')} className="rounded border-slate-300 text-indigo-600" />
                            {t.paid}
                        </label>
                    </div>
                </div>


                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">{t.ch2}</h4>
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 text-xs text-slate-800 font-medium">
                            <input type="checkbox" checked={settings.emailLetterViewed} onChange={() => handleToggle('emailLetterViewed')} className="rounded border-slate-300 text-indigo-600" />
                            {t.viewed}
                        </label>
                        <label className="flex items-center gap-3 text-xs text-slate-800 font-medium">
                            <input type="checkbox" checked={settings.emailPaymentClaimed} onChange={() => handleToggle('emailPaymentClaimed')} className="rounded border-slate-300 text-indigo-600" />
                            {t.paid}
                        </label>
                    </div>
                </div>


                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">{t.ch3}</h4>

                    {!tgConnected ? (
                        <div className="mt-1">
                            <a
                                href={`https://t.me/YourMoonlightBot?start=${tgToken}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition"
                            >
                                🚀 {t.tgBtnConnect}
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <span className="text-xs font-bold text-emerald-600 block mb-2">{t.tgStatusOk}</span>
                            <label className="flex items-center gap-3 text-xs text-slate-800 font-medium">
                                <input type="checkbox" checked={settings.tgLetterViewed} onChange={() => handleToggle('tgLetterViewed')} className="rounded border-slate-300 text-indigo-600" />
                                {t.viewed}
                            </label>
                            <label className="flex items-center gap-3 text-xs text-slate-800 font-medium">
                                <input type="checkbox" checked={settings.tgPaymentClaimed} onChange={() => handleToggle('tgPaymentClaimed')} className="rounded border-slate-300 text-indigo-600" />
                                {t.paid}
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={saveSettings}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold py-3 px-4 rounded-xl transition"
            >
                {loading ? '...' : t.save}
            </button>
        </div>
    )
}