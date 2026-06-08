# KOLSS CRM

Next.js CRM для лідів з Google Sheets (Meta Lead Ads), Supabase та нотифікаціями Telegram/Slack.

## Стек

- Next.js App Router
- Supabase (PostgreSQL, Auth, RLS)
- Google Sheets API (service account)
- Vercel Cron (кожні 10 хв)

## Швидкий старт

### 1. Supabase

1. Створіть новий проєкт на [supabase.com](https://supabase.com).
2. Застосуйте міграції:

```bash
npx supabase link --project-ref YOUR_REF
npx supabase db push
```

Або виконайте SQL з `supabase/migrations/20260526120000_init.sql` у SQL Editor.

3. Скопіюйте URL та ключі в `.env.local` (див. `.env.example`).

### 2. Користувачі

1. У Supabase Dashboard → Authentication → Users створіть користувачів.
2. У таблиці `profiles` встановіть `role`:
   - `super_admin` — доступ до всіх офісів
   - `office_admin` / `office_member` — лише свій офіс
3. Додайте рядки в `user_office_memberships` (`user_id`, `office_id`) для не-super-admin.

### 3. Google Sheets

1. Створіть Service Account у Google Cloud, увімкніть Sheets API.
2. Додайте `GOOGLE_SHEETS_CLIENT_EMAIL` та `GOOGLE_SHEETS_PRIVATE_KEY` у env.
3. Поділіться кожним Sheet з email service account (Editor або Viewer).
4. У таблиці `lead_import_sources` оновіть `spreadsheet_id`, `sheet_name`, встановіть `is_enabled = true`.

### 4. Нотифікації

Заповніть `TELEGRAM_*` та `SLACK_WEBHOOK_URL_*` для Києва та Варшави.

### 5. Запуск

```bash
npm install
npm run dev
```

Відкрийте http://localhost:3000 — редірект на `/login`.

### Cron (локально / manual)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/import-leads
```

На Vercel cron налаштований у `vercel.json` (потрібен Pro для інтервалу 10 хв, або зовнішній cron).

## Поведінка імпорту

- Унікальний ключ: `(source_system, external_lead_id)`; fallback: `google_sheet:{id}:{sheet}:{row}`.
- Повторний імпорт оновлює marketing-поля та `raw_payload`, **не** змінює `crm_status` / `office_id`.
- Тестові ліди (`test@meta.com`, `<test lead:`) пропускаються (окрім `IMPORT_INCLUDE_TEST_LEADS=true`).

## Коментарі

Вільні коментарі з прив’язкою до етапу pipeline (`lead_comments.pipeline_stage`). Кілька коментарів на один етап дозволені.

## Структура

- `supabase/migrations/` — схема БД + seed
- `src/services/import/` — Google Sheets → leads
- `src/services/notifications/` — outbox Telegram/Slack
- `src/app/api/cron/` — cron endpoints
- `src/app/app/leads/` — UI лідів
