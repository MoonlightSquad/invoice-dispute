"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function AuthModal({ children, dict }: any) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        setLoading(false);

        if (error) toast.error(dict.auth.error_google);
    };

    const handleMagicLink = async () => {
        if (!email) return toast.error(dict.auth.error_email);

        setLoading(true);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
        });

        setLoading(false);

        if (error) toast.error(dict.auth.error_general);
        else toast.success(dict.auth.success_msg);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{dict.auth.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Button
                        onClick={handleGoogleLogin}
                        className="w-full"
                        variant="outline"
                        disabled={loading}
                    >
                        {dict.auth.google_btn}
                    </Button>

                    <div className="text-xs text-center text-muted-foreground">
                        or
                    </div>

                    <Input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Button
                        onClick={handleMagicLink}
                        className="w-full bg-indigo-600"
                        disabled={loading}
                    >
                        {loading ? dict.auth.loading : dict.auth.magic_link_btn}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}