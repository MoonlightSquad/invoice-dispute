import React from 'react';
import { Metadata } from 'next';
import { AuthModal } from '@/components/AuthModal';

async function getDictionary(lang: string) {
    if (lang === 'uk') {
        return require('@/dictionaries/uk.json');
    }
    return require('@/dictionaries/en.json');
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return {
        title: dict.meta.title,
        description: dict.meta.description,
    };
}

export default async function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    const plans = [
        {
            name: dict.pricing.free.name,
            price: dict.pricing.free.price,
            btn: dict.pricing.free.button,
            features: dict.pricing.free.features
        },
        {
            name: dict.pricing.starter.name,
            price: dict.pricing.starter.price,
            btn: dict.pricing.starter.button,
            features: dict.pricing.starter.features,
            highlight: true
        },
        {
            name: dict.pricing.pro.name,
            price: dict.pricing.pro.price,
            btn: dict.pricing.pro.button,
            features: dict.pricing.pro.features
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans scroll-smooth">

            <section className="max-w-4xl mx-auto text-center px-4 py-20 sm:py-28">
                <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-xs font-semibold text-indigo-700 mb-6">
                    {dict.meta.badge}
                </div>
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                    {dict.hero.title_1} <br />
                    <span className="text-indigo-600">{dict.hero.title_2}</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">{dict.hero.description}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <AuthModal dict={dict}>
                        <button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-indigo-200">
                            {dict.hero.cta_button}
                        </button>
                    </AuthModal>
                    <span className="text-sm text-slate-500 font-medium">{dict.hero.free_note}</span>
                </div>
            </section>

            <section className="bg-slate-100 border-t border-slate-200 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-12 max-w-xl mx-auto">{dict.problem.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[ { icon: '💰', title: dict.problem.p1_title, desc: dict.problem.p1_desc },
                            { icon: '👻', title: dict.problem.p2_title, desc: dict.problem.p2_desc },
                            { icon: '🤯', title: dict.problem.p3_title, desc: dict.problem.p3_desc } ].map((item, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                                <div className="text-2xl mb-4">{item.icon}</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="features" className="bg-white border-b border-slate-200 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">{dict.features.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1,2,3].map((num) => (
                            <div key={num} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mb-6">{num}</div>
                                <h3 className="text-xl font-bold mb-3">{dict.features[`step${num}_title` as keyof typeof dict.features]}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{dict.features[`step${num}_desc` as keyof typeof dict.features]}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-slate-50 border-b border-slate-200 py-20">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">{dict.testimonials.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2].map((num) => (
                            <div key={num} className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                                <p className="text-slate-700 italic text-base leading-relaxed mb-6">
                                    {dict.testimonials[`t${num}_text` as keyof typeof dict.testimonials]}
                                </p>
                                <div className="font-semibold text-sm text-slate-900 border-t border-slate-100 pt-4">
                                    {dict.testimonials[`t${num}_author` as keyof typeof dict.testimonials]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="pricing" className="py-20 max-w-6xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">{dict.pricing.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {plans.map((plan, i) => (
                        <div key={i} className={`bg-white p-8 rounded-2xl border ${plan.highlight ? 'border-2 border-indigo-600 shadow-xl relative' : 'border border-slate-200 shadow-sm'}`}>
                            {plan.highlight && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Popular
                    </span>
                            )}
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{plan.name}</h3>
                            <div className="text-3xl font-black text-slate-900 mb-6">{plan.price} <span className="text-sm font-normal text-slate-500">{dict.pricing.mo}</span></div>

                            <ul className="space-y-3 mb-8 text-sm text-slate-600 border-t border-slate-100 pt-6">
                                {plan.features.map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2.5">
                                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <AuthModal dict={dict}>
                                <button className={`w-full py-3 font-semibold rounded-xl transition ${plan.highlight ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>
                                    {plan.btn}
                                </button>
                            </AuthModal>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-slate-100 border-t border-b border-slate-200 py-20">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">{dict.faq.title}</h2>
                    <div className="space-y-6">
                        {[1, 2, 3].map((num) => (
                            <div key={num} className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm">
                                <h3 className="text-base font-bold text-slate-900 mb-2">
                                    {dict.faq[`q${num}` as keyof typeof dict.faq]}
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {dict.faq[`a${num}` as keyof typeof dict.faq]}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-16 text-center px-4">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{dict.cta_bottom.title}</h2>
                    <p className="text-indigo-100 mb-8 max-w-md mx-auto text-sm sm:text-base">{dict.cta_bottom.desc}</p>
                    <AuthModal dict={dict}>
                        <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-8 py-4 rounded-xl transition shadow-md">
                            {dict.cta_bottom.button}
                        </button>
                    </AuthModal>
                </div>
            </section>


        </div>
    );
}