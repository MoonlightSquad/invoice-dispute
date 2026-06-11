// app/(app)/dashboard/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { FileText, Send, MailCheck, Clock, ArrowUpRight, Plus } from 'lucide-react'
import {getDictionary} from "@/lib/i18n";

export const metadata = {
    title: 'Dashboard',
}
export default async function DashboardPage() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )

    // 1. Перевірка авторизації
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Отримання користувача з нашої БД
    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id }
    })
    if (!dbUser) redirect('/login')

    const dict = getDictionary(dbUser?.language ?? 'en')
    const documents = await prisma.document.findMany({
        where: { userId: dbUser.id },
        include: { letters: true },
        orderBy: { createdAt: 'desc' }
    })

    const totalInvoices = documents.length
    const totalSent = documents.filter(d => d.letters.some(l => l.status === 'SENT')).length
    const totalOpened = documents.filter(d => d.letters.some(l => l.status === 'OPENED')).length

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {dict.app.dashboard.title}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {dict.app.dashboard.subtitle}
                    </p>
                </div>
                <Link
                    href="/documents/new"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-indigo-100"
                >
                    <Plus className="w-4 h-4" />
                    {dict.app.dashboard.new_document}
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            {dict.app.dashboard.documents_count}
                        </p>
                        <p className="text-2xl font-semibold text-slate-950 mt-0.5">{totalInvoices}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <Send className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            {dict.app.dashboard.letters_count}
                        </p>
                        <p className="text-2xl font-semibold text-slate-950 mt-0.5">{totalSent}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <MailCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            {dict.app.dashboard.opened_count}
                        </p>
                        <p className="text-2xl font-semibold text-slate-950 mt-0.5">{totalOpened}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900">
                        {dict.app.dashboard.table_title}
                    </h3>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-medium text-slate-900 text-sm">
                            {dict.app.dashboard.no_documents}
                        </h3>
                        <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                            {dict.app.dashboard.no_documents_desc}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-3.5">
                                    {dict.app.dashboard.table_id}
                                </th>
                                <th className="px-6 py-3.5">
                                    {dict.app.dashboard.table_sum}
                                </th>
                                <th className="px-6 py-3.5">
                                    {dict.app.dashboard.table_date}
                                </th>
                                <th className="px-6 py-3.5">
                                    {dict.app.dashboard.table_status}
                                </th>
                                <th className="px-6 py-3.5 text-right">
                                    {dict.app.dashboard.table_action}
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {documents.map((doc) => {
                                const latestLetter = doc.letters[doc.letters.length - 1]
                                const status = latestLetter ? latestLetter.status : 'DRAFT'

                                return (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div className="font-semibold">{doc.extractedData.clientName || dict.app.dashboard.table_unknown_client}</div>
                                            <div className="text-xs text-slate-400 font-normal mt-0.5">ID: {doc.extractedData.invoiceNumber || '—'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                                <span className="font-mono font-medium text-slate-950">
                                                    {doc.extractedData.amount ? `${doc.extractedData.amount} ${doc.currency || 'USD'}` : '—'}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(doc.createdAt).toLocaleDateString('uk-UA')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {status === 'DRAFT' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                                        <Clock className="w-3 h-3" /> {dict.app.dashboard.table_draft}
                                                    </span>
                                            )}
                                            {status === 'SENT' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                                                        <Send className="w-3 h-3" /> {dict.app.dashboard.table_sent}
                                                    </span>
                                            )}
                                            {status === 'OPENED' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        <MailCheck className="w-3 h-3" /> {dict.app.dashboard.table_opened}
                                                    </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/documents/${doc.id}`}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                {dict.app.dashboard.table_view}
                                                <ArrowUpRight className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}