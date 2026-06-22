# KOLSS CRM

Next.js CRM для лідів з Google Sheets (Meta Lead Ads) через Apps Script, Supabase та нотифікаціями Telegram/Slack.

## Стек

- Next.js App Router
- Supabase (PostgreSQL, Auth, RLS)
- Google Apps Script (push webhook)
- Telegram / Slack (миттєво після нового ліда)

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

**Ролі:**

| Роль | Доступ |
|------|--------|
| `super_admin` | Усі офіси, адмін-панель користувачів (`/app/admin/users`). Створюється вручну в Supabase. |
| `curator` | Ліди кількох офісів (Київ + Варшава), фільтр по офісу. Без адмін-панелі. |
| `office_admin` | Ліди офісів з membership. |
| `office_member` | Ліди офісів з membership. |

**Перший super_admin (вручну):**

1. Supabase Dashboard → Authentication → Users — створіть користувача.
2. SQL Editor — `profiles.role = 'super_admin'`.

**Інші користувачі** — через адмін-панель CRM (потрібен `SUPABASE_SERVICE_ROLE_KEY` у `.env.local`):

- `/app/admin/users` — список по офісах
- `/app/admin/users/new` — створення (email, пароль, роль, офіси)
- `/app/admin/users/[id]` — редагування, деактивація
- `/app/admin/users/deactivated` — деактивовані (відновлення або видалення назавжди)

Деактивація блокує вхід; дані профілю зберігаються до повного видалення.

### 3. Джерела імпорту (Google Sheets → CRM)

Кожна Google-таблиця Meta Lead Ads прив’язується до офісу в Supabase.

**Таблиця `lead_import_sources`:**

| Поле | Опис |
|------|------|
| `office_id` | UUID офісу (`kyiv` / `warsaw` з таблиці `offices`) |
| `name` | Назва джерела, напр. `Meta Lead Ads — Київ` |
| `spreadsheet_id` | ID з URL таблиці |
| `sheet_name` | Назва вкладки (зазвичай `Sheet1`) |
| `header_row` | Рядок заголовків (зазвичай `1`) |
| `is_enabled` | `true` для активного джерела |
| `id` | UUID рядка — потрібен для Apps Script як `SOURCE_ID` |

Для Києва і Варшави — окремі рядки (різні таблиці / `office_id`).

**Env CRM:**

```bash
IMPORT_WEBHOOK_SECRET=<довгий випадковий рядок>
```

**Google Apps Script** (скрипт: `scripts/google-apps-script/meta-leads-import.gs`):

1. У таблиці: Extensions → Apps Script → вставте скрипт.
2. Project settings → Script properties:

| Property | Значення |
|----------|----------|
| `CRM_WEBHOOK_URL` | `https://your-crm.vercel.app/api/webhooks/import-lead` |
| `IMPORT_WEBHOOK_SECRET` | той самий секрет, що в CRM |
| `SOURCE_ID` | `id` з `lead_import_sources` |
| `SHEET_NAME` | назва вкладки |
| `HEADER_ROW` | `1` (опційно) |

3. Запустіть `installTrigger()` — автосинк кожні 5 хв.
4. Запустіть `syncAllLeads()` — одноразовий імпорт існуючих рядків.

### 4. Нотифікації

Заповніть `TELEGRAM_*` та `SLACK_WEBHOOK_URL_*` для Києва та Варшави.

### 5. Storage (файли лідів)

Після міграції `20260526140000_lead_form_fields_attachments.sql` з’явиться bucket `lead-attachments` (приватний, до 5 МБ, PDF/JPG/PNG/DOCX/XLSX).

Якщо bucket не створився автоматично, у Dashboard → **Storage** → **New bucket**:
- Name: `lead-attachments`
- Public: **off**
- File size limit: **5 MB**
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, Word/Excel OpenXML

Завантаження йде через server action (service role). Перегляд — через signed URL на картці ліда.

### 6. Запуск

```bash
npm install
npm run dev
```

Відкрийте http://localhost:3000 — редірект на `/login`.

### Webhook (тест імпорту)

```bash
curl -X POST http://localhost:3000/api/webhooks/import-lead \
  -H "Authorization: Bearer $IMPORT_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"source_id":"<uuid>","rows":[{"id":"l:123","created_time":"2026-05-20T08:31:53-05:00","phone_number":"p:+380501234567","full_name":"Test","email":"a@b.com"}]}'
```

## Поведінка імпорту

- Унікальний ключ: `(source_system, external_lead_id)`; Meta `id` → `l:{id}`.
- Повторний імпорт оновлює marketing-поля та `raw_payload`, **не** змінює `crm_status` / `office_id`.
- Тестові ліди (`test@meta.com`, `<test lead:`) пропускаються (окрім `IMPORT_INCLUDE_TEST_LEADS=true`).
- Колонка `lead_status` у Sheet (Meta NEW/WORKING) **не** синхронізується в CRM pipeline.

## Коментарі

Вільні коментарі з прив’язкою до етапу pipeline (`lead_comments.pipeline_stage`). Кілька коментарів на один етап дозволені.

## Структура

- `supabase/migrations/` — схема БД + seed
- `docs/PERFORMANCE.md` — продуктивність, cold start Supabase, локальні виміри
- `scripts/google-apps-script/` — Apps Script для push-імпорту
- `src/services/import/` — мапінг Meta → leads, webhook upsert
- `src/services/notifications/` — outbox Telegram/Slack
- `src/app/api/webhooks/` — webhook імпорту
- `src/app/app/leads/` — UI лідів
