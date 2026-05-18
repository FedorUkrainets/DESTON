# DESTON — интернет-магазин одежды

Production-ready stack: **Next.js 15 App Router · TypeScript (strict) · CSS Modules · Zustand · Prisma · PostgreSQL · Resend · YooKassa (architecture) · Docker**.

## Запуск

```bash
# 1) переменные окружения
cp .env.example .env.local

# 2) установка зависимостей
npm install

# 3) база данных
docker compose up -d db
npx prisma migrate dev --name init
npm run prisma:seed

# 4) разработка
npm run dev
```

Открыть http://localhost:3000.

## Скрипты

| Скрипт | Назначение |
| --- | --- |
| `npm run dev` | dev-сервер |
| `npm run build` | продакшн-сборка (включая `prisma generate`) |
| `npm run start` | запуск собранной версии |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript noEmit |
| `npm run prisma:migrate` | миграции в dev |
| `npm run prisma:deploy` | миграции в проде |
| `npm run prisma:seed` | сидинг каталога |

## Docker

```bash
docker compose up --build
```

Сервис `app` слушает `3000`, `db` — `5432`.

## Архитектура

| Папка | Содержимое |
| --- | --- |
| `src/app` | Маршруты App Router (`/`, `/catalog`, `/catalog/[slug]`, `/contacts`, `/help`, `/checkout`, `/checkout/success`, `/api/*`) |
| `src/features` | Feature-based слои: `catalog`, `product`, `cart` (Zustand), `checkout` (Zod), `order`, `payment` (YooKassa провайдер) |
| `src/components` | Layout (`Header`, `Footer`) и UI-примитивы (`Button`, `Input`, `Select`) |
| `src/lib` | `prisma`, `resend`, `supabase`, `env` (валидируется Zod), `utils/*`, `email/*`, `validation/*` |
| `prisma/` | `schema.prisma`, `seed.ts` |

## Безопасность

- Strict TypeScript (`noUncheckedIndexedAccess`, `noImplicitAny`)
- Все формы — Zod (`CheckoutFormSchema`) + server validation (`CreateOrderRequestSchema`)
- Никаких raw SQL — только Prisma
- Запрет `dangerouslySetInnerHTML` через ESLint (`react/no-danger`)
- CSP/X-Frame/X-Content-Type-Options заголовки в `next.config.ts`
- Rate limiting (`src/lib/utils/rate-limit.ts`) на всех публичных API
- Sanitization input'а перед персистом (`src/lib/utils/sanitize.ts`)
- Webhook YooKassa проверяет shared secret + IP-whitelist

## Платежи (YooKassa)

Архитектура подготовлена: `src/features/payment/providers/yookassa.ts` реализует абстракцию
`PaymentProvider`. Если креды отсутствуют — провайдер возвращает stub, заказ всё равно создаётся,
письмо отправляется (если настроен Resend).

`POST /api/orders` → создаёт заказ, создаёт платёж, возвращает `confirmationUrl`. Фронтенд
выполняет `window.location.href = confirmationUrl`. После оплаты — редирект на `/checkout/success`.
Webhook `POST /api/payment/webhook` обновляет статус заказа и при `SUCCEEDED` отправляет письмо.

## Адаптив

Брейкпоинты: `≤480`, `≤640`, `≤768`, `≤900`. Header, Footer, Product, Cart, Checkout проверены на mobile/tablet/desktop.
