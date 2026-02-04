import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'

/**
 * SSO callback endpoint для автентифікації користувачів з Mercury LMS
 * Використовує Admin API для створення session без email підтвердження
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/?error=missing_token', request.url))
    }

    // Перевіряємо та розшифровуємо JWT токен
    const ssoSecret = process.env.WORDLY_SSO_SECRET || 'default-secret-change-in-production'
    const secret = new TextEncoder().encode(ssoSecret)

    let payload
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, secret)
      payload = verifiedPayload
    } catch (err) {
      console.error('JWT verification failed:', err)
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url))
    }

    // Витягуємо дані з токену
    const email = payload.email as string
    const source = payload.source as string

    if (!email || source !== 'mercury-lms') {
      return NextResponse.redirect(new URL('/?error=invalid_payload', request.url))
    }

    // Створюємо Admin client для Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found')
      return NextResponse.redirect(new URL('/?error=server_configuration', request.url))
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Перевіряємо чи існує користувач
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const user = existingUser?.users?.find((u) => u.email === email)

    if (!user) {
      // Створюємо нового користувача якщо не існує
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true, // Автоматично підтверджуємо email
        user_metadata: {
          source: 'mercury-lms-sso',
          app_type: 'wordly', // Вказуємо що це користувач Wordly
        },
      })

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError)
        return NextResponse.redirect(new URL('/?error=user_creation_failed', request.url))
      }
    }

    // ВАЖЛИВО: Генеруємо пароль та створюємо/оновлюємо користувача
    // Це дозволяє уникнути magic link який може редиректити через Google
    const wordlyAppUrl =
      process.env.NEXT_PUBLIC_WORDLY_APP_URL || 'https://wordly-gules.vercel.app'

    // Генеруємо безпечний пароль для користувача
    const password = `sso-${Math.random().toString(36).slice(2)}-${Date.now()}`

    let userId: string

    if (!user) {
      // Створюємо нового користувача з паролем
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          source: 'mercury-lms-sso',
          app_type: 'wordly',
        },
      })

      if (createError || !newUser.user) {
        console.error('Error creating user with password:', createError)
        return NextResponse.redirect(new URL('/?error=user_creation_failed', request.url))
      }

      userId = newUser.user.id
    } else {
      // Оновлюємо пароль для існуючого користувача
      userId = user.id
      await supabaseAdmin.auth.admin.updateUserById(userId, { password })
    }

    // Кодуємо credentials в base64 для передачі через URL
    const credentials = Buffer.from(`${email}:${password}`).toString('base64')

    // Редиректимо на callback з credentials
    const redirectUrl = new URL(`${wordlyAppUrl}/auth/callback`)
    redirectUrl.searchParams.set('credentials', credentials)

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('SSO error:', error)
    return NextResponse.redirect(new URL('/?error=server_error', request.url))
  }
}
