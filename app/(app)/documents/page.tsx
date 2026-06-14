// app/(app)/dashboard/documents/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { FileText, Send, MailCheck, Clock, ArrowUpRight, Plus } from 'lucide-react'

// Імпортуємо нові клієнтські компоненти
import Search from '@/components/Search'
import Pagination from '@/components/Pagination'
import { getDictionary } from "@/lib/i18n";

export const metadata = {
    title: 'All Documents',
}

// 1. СТВОРЮЄМО ІНТЕРФЕЙС ДЛЯ JSON ДАНИХ
interface ExtractedInvoiceData {
    clientName?: string;
    invoiceNumber?: string;
    amount?: number | string;
    currency?: string;
}

export default async function DocumentsPage(props: {
    searchParams?: Promise<{ query?: string; page?: string }>
}) {
    const searchParams = await props.searchParams
    const query = searchParams?.query || ''
    const currentPage = Number(searchParams?.page) || 1

    const ITEMS_PER_PAGE = 10

    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id }
    })
    if (!dbUser) redirect('/login')

    const dict = getDictionary(dbUser?.language ?? 'en')

    const whereClause = {
        userId: dbUser.id,
        ...(query ? {
            OR: [
                {
                    extractedData: {
                        path: ['clientName'],
                        string_contains: query,
                        mode: 'insensitive' as const
                    }
                },
                {
                    extractedData: {
                        path: ['invoiceNumber'],
                        string_contains: query,
                        mode: 'insensitive' as const
                    }
                }
            ]
        } : {})
    }

    const totalItems = await prisma.document.count({ where: whereClause })
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

    const documents = await prisma.document.findMany({
        where: whereClause,
        include: { letters: true },
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE
    })

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {dict.app.documents.title}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {dict.app.documents.subtitle}
                    </p>
                </div>
                <Link
                    href="/documents/new"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-indigo-100 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    {dict.app.dashboard.new_document}
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">

                <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                    <Search placeholder={dict.app.documents.search_input} />
                    <div className="text-sm text-slate-500 font-medium px-2 whitespace-nowrap">
                        {dict.app.documents.total_count}: {totalItems}
                    </div>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-20 px-4">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="font-medium text-slate-900 text-lg">{dict.app.dashboard.no_documents}</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                            {dict.app.dashboard.no_documents_desc}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                            <tr className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                                // 2. ПРИВОДИМО ТИП ТУТ
                                const data = doc.extractedData as ExtractedInvoiceData | null;

                                const latestLetter = doc.letters[doc.letters.length - 1]
                                const status = latestLetter ? latestLetter.status : 'DRAFT'

                                return (
                                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {/* 3. ВИКОРИСТОВУЄМО data ЗАМІСТЬ doc.extractedData */}
                                                        {data?.clientName || dict.app.dashboard.table_unknown_client || 'Unknown Client'}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-normal mt-0.5">
                                                        ID: {data?.invoiceNumber || '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                                <span className="font-mono font-medium text-slate-900 bg-slate-50 px-2 py-1 rounded-md">
                                                    {data?.amount ? `${data.amount}` : '—'}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                            {new Date(doc.createdAt).toLocaleDateString('uk-UA', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {status === 'DRAFT' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                                                        <Clock className="w-3.5 h-3.5" /> {dict.app.dashboard.table_draft}
                                                    </span>
                                            )}
                                            {status === 'SENT' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100/60">
                                                        <Send className="w-3.5 h-3.5" /> {dict.app.dashboard.table_sent}
                                                    </span>
                                            )}
                                            {status === 'OPENED' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm shadow-emerald-100/50">
                                                        <MailCheck className="w-3.5 h-3.5" /> {dict.app.dashboard.table_opened}
                                                    </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/documents/${doc.id}`}
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-4 py-2 rounded-xl transition-all shadow-sm"
                                            >
                                                {dict.app.dashboard.table_view}
                                                <ArrowUpRight className="w-4 h-4" />
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

            {totalPages > 1 && (
                <Pagination totalPages={totalPages} currentPage={currentPage} />
            )}
        </div>
    )
}