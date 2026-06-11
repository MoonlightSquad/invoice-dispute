// app/dashboard/documents/new/NewDocumentClient.tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getDictionary } from "@/lib/i18n"

export default function NewDocumentClient({ lang }: { lang: string }) {
    const router = useRouter()
    const [dragging, setDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    // Отримуємо словник перекладів на основі пропса lang
    const dict = getDictionary(lang)

    const handleFile = useCallback((f: File) => {
        if (f.type !== 'application/pdf') {
            toast.error(dict.app.newDocument.errors.invalid_type)
            return
        }
        if (f.size > 10 * 1024 * 1024) {
            toast.error(dict.app.newDocument.errors.file_too_large)
            return
        }
        setFile(f)
    }, [dict])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFile(f)
    }, [handleFile])

    const handleUpload = async () => {
        if (!file) return
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/documents', { method: 'POST', body: formData })
            const data = await res.json()

            setUploading(false)

            if (!res.ok) {
                const messages: Record<string, string> = {
                    limit_reached: dict.app.newDocument.errors.limit_reached,
                    invalid_type: dict.app.newDocument.errors.invalid_type,
                    file_too_large: dict.app.newDocument.errors.file_too_large,
                    upload_failed: dict.app.newDocument.errors.upload_failed,
                }
                toast.error(messages[data.error] ?? dict.app.newDocument.errSomethingWentWrong)
                return
            }

            toast.success(dict.app.newDocument.successUpload)
            router.push(`/documents/${data.document.id}`)
        } catch (error) {
            setUploading(false)
            toast.error(dict.app.newDocument.errSomethingWentWrong)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">{dict.app.newDocument.title}</h1>
                <p className="text-slate-500 text-sm mt-1">{dict.app.newDocument.description}</p>
            </div>

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition cursor-pointer ${
                    dragging ? 'border-indigo-400 bg-indigo-50' :
                        file ? 'border-green-400 bg-green-50' :
                            'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <input
                    id="file-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f)
                    }}
                />

                {file ? (
                    <div>
                        <div className="text-4xl mb-3">📄</div>
                        <p className="font-semibold text-slate-900">{file.name}</p>
                        <p className="text-sm text-slate-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setFile(null)
                            }}
                            className="text-xs text-red-500 mt-2 hover:underline"
                        >
                            {dict.app.newDocument.remove}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="text-4xl mb-3">☁️</div>
                        <p className="font-semibold text-slate-700">{dict.app.newDocument.dragDrop}</p>
                        <p className="text-sm text-slate-400 mt-1">{dict.app.newDocument.clickBrowse}</p>
                        <p className="text-xs text-slate-300 mt-3">{dict.app.newDocument.limits}</p>
                    </div>
                )}
            </div>

            {file && (
                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-sm"
                >
                    {uploading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                            {dict.app.newDocument.btnUploading}
                        </span>
                    ) : dict.app.newDocument.btnContinue}
                </button>
            )}
        </div>
    )
}