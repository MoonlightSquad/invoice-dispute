'use client'

import { useState } from 'react'
import { Globe, CreditCard, Check, Loader2, Sparkles, Calendar, AlertCircle } from 'lucide-react'
import { getDictionary } from "@/lib/i18n"

const VARIANTS = {
    STARTER: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STARTER_VARIANT_ID || 'starter_id_placeholder',
    PRO: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRO_VARIANT_ID || 'pro_id_placeholder',
}

export default function SettingsClient({ user }: { user: any }) {
    const [activeTab, setActiveTab] = useState<'general' | 'billing'>('general')
    const [language, setLanguage] = useState(user.language || 'en')
    const [isSavingLang, setIsSavingLang] = useState(false)
    const [loadingVariantId, setLoadingVariantId] = useState<string | null>(null)

    const dict = getDictionary(user?.language ?? 'en')
    const currentPlan = user.plan || 'FREE'

    const latestSubscription = user.subscriptions?.[0] || null

    const pricingPlans = [
        {
            type: 'FREE',
            name: 'Free',
            price: '$0',
            variantId: null,
            features: dict.app.settings.features.free,
        },
        {
            type: 'STARTER',
            name: 'Starter',
            price: '$19',
            variantId: VARIANTS.STARTER,
            highlight: true,
            features: dict.app.settings.features.starter,
        },
        {
            type: 'PRO',
            name: 'Pro',
            price: '$49',
            variantId: VARIANTS.PRO,
            features: dict.app.settings.features.pro,
        }
    ]

    const handleSaveLanguage = async (newLang: string) => {
        setIsSavingLang(true)
        setLanguage(newLang)
        try {
            const res = await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: newLang })
            })
            if (!res.ok) throw new Error()
        } catch (err) {
            alert(dict.app.settings.errorLang)
        } finally {
            setIsSavingLang(false)
            window.location.href = window.location.href
        }
    }

    const handleSubscribe = async (variantId: string) => {
        setLoadingVariantId(variantId)
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variantId })
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error()
            }
        } catch (err) {
            alert(dict.app.settings.errorBilling)
        } finally {
            setLoadingVariantId(null)
        }
    }

    // Хелпер для красивого форматування дат
    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString(language === 'uk' ? 'uk-UA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Сайдбар */}
            <div className="w-full md:w-64 bg-white rounded-2xl border border-slate-200/80 p-2 flex flex-row md:flex-col gap-1 shrink-0">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                        activeTab === 'general' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Globe className="w-4 h-4" />
                    {dict.app.settings.global}
                </button>
                <button
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                        activeTab === 'billing' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <CreditCard className="w-4 h-4" />
                    {dict.app.settings.billing}
                </button>
            </div>

            {/* Контентна частина */}
            <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {activeTab === 'general' && (
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{dict.app.settings.langTitle}</h3>
                            <p className="text-slate-500 text-xs mt-0.5">{dict.app.settings.langDesc}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => handleSaveLanguage('uk')}
                                className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                                    language === 'uk' ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10' : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    <div className="font-semibold text-slate-900 text-sm">Українська</div>
                                    <div className="text-xs text-slate-400 mt-0.5">UA Interface</div>
                                </div>
                                {language === 'uk' && <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>}
                            </button>

                            <button
                                onClick={() => handleSaveLanguage('en')}
                                className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                                    language === 'en' ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10' : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    <div className="font-semibold text-slate-900 text-sm">English</div>
                                    <div className="text-xs text-slate-400 mt-0.5">EN Interface</div>
                                </div>
                                {language === 'en' && <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>}
                            </button>
                        </div>
                        {isSavingLang && (
                            <p className="text-xs text-indigo-600 flex items-center gap-1.5 animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" /> {dict.app.settings.saving}
                            </p>
                        )}
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{dict.app.settings.plansTitle}</h3>
                            <p className="text-slate-500 text-xs mt-0.5">{dict.app.settings.plansDesc}</p>
                        </div>

                        {/* === НОВИЙ БЛОК: Стан поточної підписки користувача === */}
                        {latestSubscription && currentPlan !== 'FREE' && (
                            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                latestSubscription.status === 'cancelled'
                                    ? 'bg-amber-50/40 border-amber-200 text-amber-900'
                                    : 'bg-indigo-50/30 border-indigo-100 text-slate-800'
                            }`}>
                                <div className="flex items-start gap-3">
                                    {latestSubscription.status === 'cancelled' ? (
                                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    ) : (
                                        <Calendar className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <div className="text-sm font-semibold">
                                            {language === 'uk' ? 'Деталі підписки' : 'Subscription details'}
                                            <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                                                latestSubscription.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {latestSubscription.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {latestSubscription.status === 'cancelled' && latestSubscription.endsAt && (
                                                language === 'uk'
                                                    ? `Доступ скасовано. План діє до ${formatDate(latestSubscription.endsAt)}`
                                                    : `Subscription cancelled. Access remains valid until ${formatDate(latestSubscription.endsAt)}`
                                            )}
                                            {latestSubscription.status === 'active' && latestSubscription.renewsAt && (
                                                language === 'uk'
                                                    ? `Наступне списання відбудеться ${formatDate(latestSubscription.renewsAt)}`
                                                    : `Next renewal date is ${formatDate(latestSubscription.renewsAt)}`
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* ==================================================== */}

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
                            {pricingPlans.map((plan, index) => {
                                const isCurrentPlan = currentPlan === plan.type

                                return (
                                    <div
                                        key={index}
                                        className={`rounded-2xl border p-5 flex flex-col justify-between relative transition-all ${
                                            isCurrentPlan
                                                ? 'border-indigo-600 bg-indigo-50/10 ring-2 ring-indigo-600/5'
                                                : plan.highlight
                                                    ? 'border-indigo-200 shadow-sm bg-slate-50/50'
                                                    : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        {isCurrentPlan ? (
                                            <span className="absolute -top-2.5 left-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                {latestSubscription?.status === 'cancelled' && plan.type !== 'FREE'
                                                    ? (language === 'uk' ? 'Переривається' : 'Expiring')
                                                    : dict.app.settings.badgeCurrent
                                                }
                                            </span>
                                        ) : plan.highlight ? (
                                            <span className="absolute -top-2.5 left-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                <Sparkles className="w-2.5 h-2.5" /> {dict.app.settings.badgePopular}
                                            </span>
                                        ) : null}

                                        <div>
                                            <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">{plan.name}</div>
                                            <div className="mt-2 flex items-baseline gap-1">
                                                <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                                                <span className="text-xs text-slate-400">{dict.app.settings.perMonth}</span>
                                            </div>

                                            <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 flex-1">
                                                {plan.features.map((feat, fIdx) => (
                                                    <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-600">
                                                        <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                                        <span>{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="mt-6">
                                            {isCurrentPlan ? (
                                                <button
                                                    disabled
                                                    className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-medium text-xs py-2 px-4 rounded-xl cursor-not-allowed"
                                                >
                                                    {latestSubscription?.status === 'cancelled'
                                                        ? (language === 'uk' ? 'Активний до кінця терміну' : 'Active until expiration')
                                                        : dict.app.settings.btnCurrent
                                                    }
                                                </button>
                                            ) : plan.type === 'FREE' ? (
                                                <button
                                                    disabled
                                                    className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-medium text-xs py-2 px-4 rounded-xl cursor-not-allowed"
                                                >
                                                    {dict.app.settings.btnBasic}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSubscribe(plan.variantId!)}
                                                    disabled={loadingVariantId !== null}
                                                    className={`w-full text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm ${
                                                        plan.highlight
                                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                                                            : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                                                    }`}
                                                >
                                                    {loadingVariantId === plan.variantId ? (
                                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                                    ) : (
                                                        `${dict.app.settings.btnSelect} ${plan.name}`
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}