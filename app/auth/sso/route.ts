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

    // ВАЖЛИВО: Замість magic link створюємо session token напряму
    // Це потрібно щоб уникнути конфлікту між Wordly та Tiny Life Coach
    const wordlyAppUrl =
      process.env.NEXT_PUBLIC_WORDLY_APP_URL || 'https://wordly-gules.vercel.app'

    // Створюємо OTP token для автоматичного входу
    const { data: otpData, error: otpError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: wordlyAppUrl,
      },
    })

    if (otpError || !otpData) {
      console.error('Error generating OTP:', otpError)
      return NextResponse.redirect(new URL('/?error=link_generation_failed', request.url))
    }

    // Витягуємо параметри з action_link
    const actionLink = new URL(otpData.properties.action_link)
    const accessToken = actionLink.searchParams.get('access_token')
    const refreshToken = actionLink.searchParams.get('refresh_token')

    if (!accessToken || !refreshToken) {
      console.error('No tokens in action link')
      return NextResponse.redirect(new URL('/?error=token_generation_failed', request.url))
    }

    // Редиректимо на callback сторінку Wordly з токенами в хеші
    const redirectUrl = new URL(`${wordlyAppUrl}/auth/callback`)
    redirectUrl.hash = `access_token=${accessToken}&refresh_token=${refreshToken}&type=magiclink`

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('SSO error:', error)
    return NextResponse.redirect(new URL('/?error=server_error', request.url))
  }
}
