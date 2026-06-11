'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function SignOutButton({ label }: { label: string }) {
    const router = useRouter()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/en')
    }

    return (
        <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-sm font-medium text-red-500 transition"
        >
            {label}
        </button>
    )
}