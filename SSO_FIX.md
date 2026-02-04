# Виправлення SSO для Wordly (конфлікт з Tiny Life Coach)

## Проблема

Wordly і Tiny Life Coach використовують одну Supabase базу даних, що призводить до конфліктів при SSO автентифікації.

## Рішення

### 1. Оновити Supabase URL Configuration

Перейдіть в [Supabase Dashboard](https://supabase.com/dashboard) → проект Wordly (`imcszsrkfjclekohqebc`):

1. **Authentication → URL Configuration**
2. **Site URL** встановіть: `https://wordly-gules.vercel.app`
3. **Redirect URLs** додайте:
   ```
   https://wordly-gules.vercel.app/**
   https://wordly-gules.vercel.app/auth/callback
   https://tini-life-coach.vercel.app/**
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```
4. Натисніть **Save**

### 2. Перезапустити Wordly

```bash
cd /Users/vladislav/Documents/wordly
npm run dev
```

### 3. Перезапустити Mercury LMS

```bash
cd /Users/vladislav/Documents/mercury-lms
npm run dev
```

### 4. Повністю очистити браузер (ДУЖЕ ВАЖЛИВО!)

**Проблема**: Якщо ви вже залогінені в Wordly через Google, браузер використовує існуючу сесію.

**Рішення**:
1. **Варіант A** (рекомендую): Відкрийте LMS в **режимі інкогніто/приватному режимі**
2. **Варіант B**: Повністю очистіть дані Wordly:
   - Відкрийте https://wordly-gules.vercel.app
   - DevTools (F12) → Application → Storage → Clear site data
   - **Вийдіть з Google акаунту** якщо залогінені
   - Закрийте всі вкладки Wordly

### 5. Протестувати SSO

1. Увійдіть в Mercury LMS як студент (в режимі інкогніто якщо використовуєте Варіант A)
2. Перейдіть на "Вивчення слів"
3. Ви побачите:
   - Спочатку "Authenticating from Mercury LMS..."
   - Потім автоматично відкриється Wordly головна сторінка
4. **Перевірте email**: повинен бути ваш email від LMS, не Google email

## Як це працює тепер

1. LMS генерує SSO токен
2. Wordly приймає токен і створює session
3. Токени передаються напряму через URL hash (не через redirect)
4. Це уникає конфлікту між двома додатками

## Якщо проблема залишається

### Варіант 1: Створити окремий Supabase проект для Wordly

Найкраще рішення - розділити дані:

1. Створити новий Supabase проект тільки для Wordly
2. Мігрувати дані з поточного проекту
3. Оновити `.env.local` в Wordly

### Варіант 2: Додати app_type фільтр

Якщо хочете залишити один проект:

1. Додати поле `app_type` до всіх таблиць
2. Фільтрувати дані за `app_type = 'wordly'`
3. Tiny Life Coach використовуватиме `app_type = 'tiny-life-coach'`

## Технічні деталі

- **Змінено**: `/auth/sso/route.ts` - тепер використовує прямі токени замість magic link
- **Переваги**: Уникає редиректів через Supabase, які можуть йти на неправильний URL
- **Безпека**: Токени передаються в URL hash (не видно на сервері)
