'use client'

import { useState, useEffect, useCallback } from 'react'
import { Globe, CreditCard, Check, Loader2, Sparkles, Calendar, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { getDictionary } from "@/lib/i18n"

export default function SettingsClient({ user }: { user: any }) {
    const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'notifications'>('general')
    const [language, setLanguage] = useState(user.language || 'en')
    const [isSavingLang, setIsSavingLang] = useState(false)
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

    const [payments, setPayments] = useState<any[]>([])
    const [paymentsPage, setPaymentsPage] = useState(1)
    const [isLoadingPayments, setIsLoadingPayments] = useState(false)
    const [hasMorePayments, setHasMorePayments] = useState(false)

    // Нові стейти для системи сповіщень
    const [notifSettings, setNotifSettings] = useState({
        inAppLetterViewed: user.notificationSettings?.inAppLetterViewed ?? true,
        inAppPaymentClaimed: user.notificationSettings?.inAppPaymentClaimed ?? true,
        emailLetterViewed: user.notificationSettings?.emailLetterViewed ?? false,
        emailPaymentClaimed: user.notificationSettings?.emailPaymentClaimed ?? true,
        tgLetterViewed: user.notificationSettings?.tgLetterViewed ?? false,
        tgPaymentClaimed: user.notificationSettings?.tgPaymentClaimed ?? true,
    })
    const [isSavingNotif, setIsSavingNotif] = useState(false)
    const [notifStatus, setNotifStatus] = useState<'success' | 'error' | null>(null)

    const dict = getDictionary(user?.language ?? 'en')
    const currentPlan = user.plan || 'FREE'
    const latestSubscription = user.subscriptions?.[0] || null
    const allSubscriptions = user.subscriptions || []

    const tgConnected = !!user.telegramSession?.chatId
    const tgToken = user.telegramSession?.telegramToken || 'LINK_TOKEN'

    const pricingPlans = [
        {
            type: 'FREE',
            name: 'Free',
            price: '$0',
            features: dict.app.settings.features.free,
        },
        {
            type: 'STARTER',
            name: 'Starter',
            price: '$19',
            highlight: true,
            features: dict.app.settings.features.starter,
        },
        {
            type: 'PRO',
            name: 'Pro',
            price: '$49',
            features: dict.app.settings.features.pro,
        }
    ]

    const fetchPayments = useCallback(async (page: number) => {
        if (!latestSubscription?.lsSubscriptionId) return

        setIsLoadingPayments(true)
        try {
            const res = await fetch(`/api/billing/payments?subscriptionId=${latestSubscription.lsSubscriptionId}&page=${page}`)
            if (res.ok) {
                const data = await res.json()
                setPayments(data.payments || [])
                setHasMorePayments(data.hasMore || false)
            }
        } catch (err) {
            console.error('Failed to fetch payments:', err)
        } finally {
            setIsLoadingPayments(false)
        }
    }, [latestSubscription?.lsSubscriptionId])

    useEffect(() => {
        if (activeTab === 'billing' && latestSubscription?.lsSubscriptionId) {
            fetchPayments(paymentsPage)
        }
    }, [activeTab, paymentsPage, fetchPayments])

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

    const handleToggleNotif = (key: string) => {
        setNotifSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
    }

    const handleSaveNotifications = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingNotif(true)
        setNotifStatus(null)
        try {
            const res = await fetch('/api/user/notification-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notifSettings)
            })
            if (res.ok) {
                setNotifStatus('success')
            } else {
                throw new Error()
            }
        } catch (err) {
            setNotifStatus('error')
        } finally {
            setIsSavingNotif(false)
        }
    }

    const handleSubscribe = async (planType: string) => {
        setLoadingPlan(planType)
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType })
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
            setLoadingPlan(null)
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString(language === 'uk' ? 'uk-UA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount: number, ccy: number) => {
        const value = (amount / 100).toFixed(2)
        if (ccy === 840) return `$${value}`
        if (ccy === 980) return `${value} грн`
        return `${value} (${ccy})`
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
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
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                        activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <AlertCircle className="w-4 h-4" />
                    {dict.app.settings.notifications.title}
                </button>
            </div>

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
                    <div className="p-6 space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{dict.app.settings.plansTitle}</h3>
                            <p className="text-slate-500 text-xs mt-0.5">{dict.app.settings.plansDesc}</p>
                        </div>

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
                                                    ? (language === 'uk' ? 'Перериється' : 'Expiring')
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
                                            ) : (
                                                <button
                                                    onClick={() => handleSubscribe(plan.type)}
                                                    disabled={loadingPlan !== null}
                                                    className={`w-full text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm ${
                                                        plan.highlight
                                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                                                            : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                                                    }`}
                                                >
                                                    {loadingPlan === plan.type ? (
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

                        {allSubscriptions.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    {language === 'uk' ? 'Історія підписок' : 'Subscription History'}
                                </h4>
                                <div className="overflow-x-auto rounded-xl border border-slate-200/60">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                        <tr className="bg-slate-50/70 border-b border-slate-200/60 text-slate-600 font-medium">
                                            <th className="p-3">{language === 'uk' ? 'План' : 'Plan'}</th>
                                            <th className="p-3">{language === 'uk' ? 'Статус' : 'Status'}</th>
                                            <th className="p-3">{language === 'uk' ? 'Створено' : 'Created At'}</th>
                                            <th className="p-3">{language === 'uk' ? 'Оновлення / Кінець' : 'Renews / Ends At'}</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {allSubscriptions.map((sub: any) => (
                                            <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                                                <td className="p-3 font-semibold text-slate-900">{sub.plan}</td>
                                                <td className="p-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                                                            sub.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {sub.status}
                                                        </span>
                                                </td>
                                                <td className="p-3 text-slate-500">{formatDate(sub.createdAt)}</td>
                                                <td className="p-3 text-slate-500">
                                                    {sub.status === 'success' ? formatDate(sub.renewsAt) : (sub.endsAt ? formatDate(sub.endsAt) : '-')}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {latestSubscription?.lsSubscriptionId && (
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                        {language === 'uk' ? 'Історія платежів' : 'Payment History'}
                                    </h4>
                                    {isLoadingPayments && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200/60">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                        <tr className="bg-slate-50/70 border-b border-slate-200/60 text-slate-600 font-medium">
                                            <th className="p-3">{language === 'uk' ? 'ID Підписки' : 'Subscription ID'}</th>
                                            <th className="p-3">{language === 'uk' ? 'Дата' : 'Date'}</th>
                                            <th className="p-3">{language === 'uk' ? 'Сума' : 'Amount'}</th>
                                            <th className="p-3">{language === 'uk' ? 'Статус' : 'Status'}</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {payments.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-slate-400">
                                                    {isLoadingPayments
                                                        ? (language === 'uk' ? 'Завантаження...' : 'Loading...')
                                                        : (language === 'uk' ? 'Платежів не знайдено' : 'No payments found')}
                                                </td>
                                            </tr>
                                        ) : (
                                            payments.map((p: any, idx: number) => (
                                                <tr key={p.invoiceId || idx} className="hover:bg-slate-50/40 transition-colors">
                                                    <td className="p-3 font-mono text-slate-500 max-w-[120px] truncate" title={latestSubscription.lsSubscriptionId}>
                                                        {latestSubscription.lsSubscriptionId}
                                                    </td>
                                                    <td className="p-3 text-slate-500">{formatDate(p.chargedAt || p.createdAt)}</td>
                                                    <td className="p-3 font-semibold text-slate-900">
                                                        {formatCurrency(p.amount, p.ccy)}
                                                    </td>
                                                    <td className="p-3">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                                                                p.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                                                            }`}>
                                                                {p.status}
                                                            </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>

                                { (paymentsPage > 1 || hasMorePayments) && (
                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <button
                                            onClick={() => setPaymentsPage(prev => Math.max(prev - 1, 1))}
                                            disabled={paymentsPage === 1 || isLoadingPayments}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs text-slate-500 px-1 font-medium">
                                            {language === 'uk' ? `Сторінка ${paymentsPage}` : `Page ${paymentsPage}`}
                                        </span>
                                        <button
                                            onClick={() => setPaymentsPage(prev => prev + 1)}
                                            disabled={!hasMorePayments || isLoadingPayments}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}

                {activeTab === 'notifications' && (
                    <form onSubmit={handleSaveNotifications} className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{dict.app.settings.notifications.title}</h3>
                            <p className="text-slate-500 text-xs mt-0.5">{dict.app.settings.notifications.desc}</p>
                        </div>

                        <div className="space-y-6">
                            {/* Канал 1: Внутрішні пуші */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">{dict.app.settings.notifications.inApp}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                        <div className="pr-2">
                                            <span className="text-sm font-semibold text-slate-800 block">{dict.app.settings.notifications.viewed}</span>
                                            <span className="text-[11px] text-slate-400 block mt-0.5">{dict.app.settings.notifications.viewedDesc}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifSettings.inAppLetterViewed}
                                            onChange={() => handleToggleNotif('inAppLetterViewed')}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                        <div className="pr-2">
                                            <span className="text-sm font-semibold text-slate-800 block">{dict.app.settings.notifications.paid}</span>
                                            <span className="text-[11px] text-slate-400 block mt-0.5">{dict.app.settings.notifications.paidDesc}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifSettings.inAppPaymentClaimed}
                                            onChange={() => handleToggleNotif('inAppPaymentClaimed')}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Канал 2: Email */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">{dict.app.settings.notifications.email}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                        <div className="pr-2">
                                            <span className="text-sm font-semibold text-slate-800 block">{dict.app.settings.notifications.viewed}</span>
                                            <span className="text-[11px] text-slate-400 block mt-0.5">{dict.app.settings.notifications.viewedDesc}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifSettings.emailLetterViewed}
                                            onChange={() => handleToggleNotif('emailLetterViewed')}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                        <div className="pr-2">
                                            <span className="text-sm font-semibold text-slate-800 block">{dict.app.settings.notifications.paid}</span>
                                            <span className="text-[11px] text-slate-400 block mt-0.5">{dict.app.settings.notifications.paidDesc}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifSettings.emailPaymentClaimed}
                                            onChange={() => handleToggleNotif('emailPaymentClaimed')}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Канал 3: Telegram Бот */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">{dict.app.settings.notifications.telegram}</h4>

                                {!tgConnected ? (
                                    <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="text-xs text-slate-500 max-w-md">
                                            {language === 'uk'
                                                ? 'Підключіть нашого офіційного Telegram-бота, щоб отримувати миттєві сповіщення про відкриття інвойсів та оплати прямо на ваш смартфон.'
                                                : 'Connect our official Telegram bot to receive real-time push messages about viewed invoices and declared payments.'}
                                        </div>
                                        <a
                                            href={`https://t.me/YourMoonlightBot?start=${tgToken}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-sm text-center shrink-0"
                                        >
                                            {dict.app.settings.notifications.tgConnect}
                                        </a>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                                            <Check className="w-4 h-4" /> {dict.app.settings.notifications.tgActive}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <label className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                                <div className="pr-2">
                                                    <span className="text-sm font-semibold text-slate-800 block">{dict.app.settings.notifications.viewed}</span>
                                                    <span className="text-[11px] text-slate-400 block mt-0.5">{dict.app.settings.notifications.viewedDesc}</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={notifSettings.tgLetterViewed}
                                                    onChange={() => handleToggleNotif('tgLetterViewed')}
                                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                                <div className="pr-2">
                                                    <span className="text-sm font-semibold text-slate-800 block">{dict.app.settings.notifications.paid}</span>
                                                    <span className="text-[11px] text-slate-400 block mt-0.5">{dict.app.settings.notifications.paidDesc}</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={notifSettings.tgPaymentClaimed}
                                                    onChange={() => handleToggleNotif('tgPaymentClaimed')}
                                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                {notifStatus === 'success' && <span className="text-xs font-medium text-emerald-600">✓ {dict.app.settings.notifications.success}</span>}
                                {notifStatus === 'error' && <span className="text-xs font-medium text-rose-600">❌ {dict.app.settings.notifications.error}</span>}
                            </div>
                            <button
                                type="submit"
                                disabled={isSavingNotif}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                            >
                                {isSavingNotif ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        {dict.app.settings.notifications.saving}
                                    </>
                                ) : (
                                    dict.app.settings.notifications.save
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}