import React from 'react';
import { Metadata } from 'next';

async function getDictionary(lang: string) {
    return lang === 'uk' ? require('@/dictionaries/uk.json') : require('@/dictionaries/en.json');
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return { title: `${dict.tos.title} | Invoice Dispute Resolver` };
}

export default async function TosPage({ params }: { params: Promise<{ lang: string }> }) {
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
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{dict.tos.title}</h1>
                        <p className="text-sm text-slate-500 font-medium bg-slate-100 inline-block px-3 py-1 rounded-full">
                            {dict.tos.last_updated}
                        </p>
                    </header>

                    <div className="space-y-10">
                        {dict.tos.sections.map((section: any, i: number) => (
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

                    <div className="mt-16 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <h3 className="font-bold text-indigo-900 mb-2">
                            {lang === 'uk' ? 'Важливе зауваження' : 'Important Note'}
                        </h3>
                        <p className="text-sm text-indigo-800">
                            {lang === 'uk'
                                ? 'Ми працюємо над тим, щоб надати вам найкращі інструменти для захисту бізнесу. Використовуючи наш сервіс, ви підтверджуєте, що розумієте обмеження ШІ-технологій.'
                                : 'We are committed to providing you with the best business protection tools. By using our service, you acknowledge that you understand the limitations of AI technologies.'}
                        </p>
                    </div>
                </article>
            </div>
        </div>
    );
}