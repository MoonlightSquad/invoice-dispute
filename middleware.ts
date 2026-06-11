import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. ДЕТЕКТИМО МОВУ ПО IP ТА БРАУЗЕРУ ДЛЯ ГОЛОВНОЇ (/)
    if (pathname === '/') {
        // Витягуємо код країни за IP (працює на Vercel та Cloudflare)
        // Наприклад, для України поверне 'UA'
        const country =
            request.headers.get('x-vercel-ip-country') ||
            request.headers.get('cf-ipcountry') ||
            ''

        let locale = 'uk' // Мова за замовчуванням

        if (country) {
            // Якщо IP з України — залізобетонно віддаємо 'uk'
            if (country.toUpperCase() === 'UA') {
                locale = 'uk'
            } else {
                // Якщо IP закордонний — віддаємо 'en'
                locale = 'en'
            }
        } else {
            // ФОЛБЕК (Запасний варіант): якщо заголовки IP чомусь порожні (наприклад, при локальній розробці),
            // перевіряємо стандартну мову браузера
            const acceptLanguage = request.headers.get('accept-language')
            locale = acceptLanguage?.includes('en') ? 'en' : 'uk'
        }

        return NextResponse.redirect(new URL(`/${locale}`, request.url))
    }

    // 2. ЛОГІКА АУТЕНТИФІКАЦІЇ ДЛЯ /dashboard
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/uk', request.url))
    }

    return response
}

export const config = {
    matcher: ['/', '/dashboard/:path*'],
}