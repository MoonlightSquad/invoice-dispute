"use client";

import React, { useState, useEffect } from "react";

interface CookieConsentProps {
    dict: any;
    lang: any;
}

export function CookieConsent({ dict, lang }: CookieConsentProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie-consent");

        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleConsent = (status: "granted" | "rejected") => {
        localStorage.setItem("cookie-consent", status);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md bg-white border border-slate-200 shadow-xl rounded-xl p-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
                {dict.gdpr?.title || "Cookie Policy"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {dict.gdpr?.text || "We use cookies to improve your experience and analyze traffic."}{" "}
                <a href={`/${lang}/privacy`} className="text-indigo-600 hover:underline font-medium">
                    {dict.privacy?.title || "Privacy Policy"}
                </a>
            </p>
            <div className="flex items-center justify-end gap-2 text-xs font-semibold">
                <button
                    onClick={() => handleConsent("rejected")}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                >
                    {dict.gdpr?.decline || "Decline"}
                </button>
                <button
                    onClick={() => handleConsent("granted")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
                >
                    {dict.gdpr?.accept || "Accept"}
                </button>
            </div>
        </div>
    );
}