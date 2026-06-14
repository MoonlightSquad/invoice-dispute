import React from 'react';
import { Metadata } from 'next';

async function getDictionary(lang: string) {
    return lang === 'uk' ? require('@/dictionaries/uk.json') : require('@/dictionaries/en.json');
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return { title: `${dict.privacy.title} | Moonlight` };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <a href={`/${lang}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-8 inline-block">
                    {lang === 'uk' ? '← Повернутися на головну' : '← Back to home'}
                </a>

                <article className="bg-white p-8 md:p-16 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
                    <header className="mb-12 border-b border-slate-100 pb-8">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{dict.privacy.title}</h1>
                        <p className="text-sm text-slate-500 font-medium bg-slate-100 inline-block px-3 py-1 rounded-full">
                            {dict.privacy.last_updated}
                        </p>
                    </header>

                    <div className="space-y-10">
                        {dict.privacy.sections.map((section: any, i: number) => (
                            <section key={i} className="group">
                                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                    <span className="text-indigo-500 opacity-50">0{i + 1}.</span>
                                    {section.title}
                                </h2>
                                <p className="text-slate-600 leading-relaxed text-lg text-justify">
                                    {section.content}
                                </p>
                            </section>
                        ))}
                    </div>

                    <div className="mt-16 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-2">
                            {lang === 'uk' ? 'Важливе зауваження' : 'Important Notice'}
                        </h3>
                        <p className="text-sm text-slate-600">
                            {lang === 'uk'
                                ? 'Ця політика може оновлюватися. Продовжуючи користуватися сервісом, ви погоджуєтесь з актуальною редакцією політики.'
                                : 'This policy may be updated. By continuing to use the service, you agree to the current version of this policy.'}
                        </p>
                    </div>
                </article>
            </div>
        </div>
    );
}