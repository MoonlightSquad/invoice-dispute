'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ totalPages, currentPage }: { totalPages: number, currentPage: number }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', pageNumber.toString())
        return `${pathname}?${params.toString()}`
    }

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <Link
                href={createPageURL(currentPage - 1)}
                className={`p-2 rounded-lg border border-slate-200 text-slate-500 transition-colors ${
                    currentPage <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-slate-50 hover:text-slate-900'
                }`}
                aria-disabled={currentPage <= 1}
            >
                <ChevronLeft className="w-5 h-5" />
            </Link>

            <span className="text-sm font-medium text-slate-700 px-4">
                Сторінка / Page {currentPage} з {totalPages}
            </span>

            <Link
                href={createPageURL(currentPage + 1)}
                className={`p-2 rounded-lg border border-slate-200 text-slate-500 transition-colors ${
                    currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-slate-50 hover:text-slate-900'
                }`}
                aria-disabled={currentPage >= totalPages}
            >
                <ChevronRight className="w-5 h-5" />
            </Link>
        </div>
    )
}