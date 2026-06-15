# KOLSS CRM — design context

Оновлено: 2026-06-11

Цей файл є робочим контекстом для наступних дизайн-задач. Він описує
поточний продукт і реалізацію, а не затверджений редизайн.

## 1. Продукт

KOLSS CRM — внутрішній робочий інструмент меблевого бізнесу для двох офісів:

- Київ;
- Варшава.

CRM покриває два різні процеси:

1. Кваліфікація нового ліда.
2. Виконання замовлення після конверсії ліда у проєкт.

Основні користувачі:

- `office_member` — щоденна робота з лідами та проєктами свого офісу;
- `office_admin` — ті самі операційні сценарії в межах офісу;
- `curator` — робота з кількома офісами;
- `super_admin` — усі офіси та керування користувачами.

Продукт двомовний на рівні частини форм і довідників:

- Київ — українські назви;
- Варшава — польські назви;
- навігація та значна частина службового UI поки залишаються українськими.

## 2. Технічні рамки

- Next.js 16, App Router, React 19, TypeScript.
- Server Components за замовчуванням; інтерактивні форми — Client Components.
- Supabase: PostgreSQL, Auth, RLS, Storage.
- Tailwind CSS 4.
- Окремої UI-бібліотеки немає.
- Іконкової бібліотеки немає.
- Зображень бренду або логотипа в `public/` немає.
- Основна ширина застосунку: `max-w-6xl`.
- Дані обмежуються за офісом через RLS і серверні запити.

Дизайн не повинен ламати:

- server actions та наявні `FormData`-контракти;
- role-based і office-based доступ;
- українські та польські підписи;
- server rendering;
- поточні URL і deep links;
- стани loading/error/empty;
- роботу без окремого task-workflow.

## 3. Інформаційна архітектура

### Публічна зона

- `/` — редірект на логін або список лідів.
- `/login` — вхід.

### Робоча зона

- `/app/leads` — список лідів.
- `/app/leads/new` — ручне створення ліда.
- `/app/leads/[id]` — картка ліда.
- `/app/projects` — список проєктів.
- `/app/projects/[id]` — картка проєкту.
- `/app/dashboard` — базова агрегована статистика.
- `/app/design` — живий каталог дизайн-системи та CRM-патернів.

### Адміністрування

- `/app/admin/users` — активні користувачі по офісах.
- `/app/admin/users/new` — створення користувача.
- `/app/admin/users/[id]` — редагування або керування станом.
- `/app/admin/users/deactivated` — деактивовані користувачі.

### Глобальна навігація

Поточний header містить:

- KOLSS CRM;
- Ліди;
- Проєкти;
- Дашборд;
- Новий лід;
- Користувачі для `super_admin`;
- ім’я, роль та вихід.

Поточні обмеження header:

- немає активного стану розділу;
- немає мобільної навігації;
- CTA «Новий лід» візуально не відрізняється від звичайного nav link;
- роль і sign out можуть створювати переповнення;
- header не sticky;
- відсутні logo mark, іконки та компактний user menu.

## 4. Поточний lead flow

Flow поки лише зафіксований. Не перепроєктовувати його без окремої задачі.

```text
new
  -> in_progress
      -> converted -> створення projects зі статусом needs_discovery
      -> failed
```

Доступні дії:

- `new`: «Взяти в роботу», «Створити проєкт», «Невдалий лід»;
- `in_progress`: «Не додзвонився», «Додзвонився», «Створити проєкт»,
  «Невдалий лід»;
- `converted`: перехід до створеного проєкту;
- `failed`: термінальний стан.

Нагадування про дзвінок:

- зберігається в `callback_due_at`;
- створюється дією «Не додзвонився»;
- показується amber badge у списку та картці;
- окремого task center немає.

Відмова:

- причина: spam, not target або price;
- для price обов’язкові бюджет клієнта і наш прорахунок.

Коментарі:

- записуються з поточним статусом ліда;
- в картці групуються за статусом;
- окремо показується технічна історія подій.

## 5. Поточний project flow

Flow поки лише зафіксований. Не перепроєктовувати його без окремої задачі.

```text
needs_discovery
  -> design_quote
  -> approval
  -> measurement
  -> contract
  -> production
  -> installation
  -> final_payment
  -> completed
```

Додаткові гілки:

- з `measurement` проєкт із `is_only_measurement` можна завершити;
- з активного етапу проєкт можна перевести в `archived` із причиною;
- `completed` та `archived` — термінальні стани.

Поточний status control:

- показує лише кнопку переходу на наступний етап;
- не візуалізує повний pipeline;
- не показує прогрес, попередні й наступні етапи;
- archive action розміщена поруч з основною дією;
- системні зміни статусу записуються як звичайні project comments.

Нагадування:

- на `approval` після трьох днів без активності показується
  «Думає >3 дні»;
- окремого календаря або task center немає.

## 6. Екрани та поточна композиція

### Login

- центрована назва продукту;
- email, password, одна primary button;
- немає брендового контексту, help/recovery links або декоративного шару;
- фактичний локальний рендер перевірено 2026-06-11.

### Leads list

- page header, office select, CTA створення;
- горизонтальний ряд status chips;
- таблиця до 50 записів;
- колонки: офіс за потреби, статус, ім’я, телефон;
- callback badge вкладений у status cell;
- pagination унизу.

Важливі дані, які доступні, але не показані у списку:

- source;
- product interest;
- city/region;
- assignee;
- created versus last status change як окремі поля;
- contact actions.

### New lead

- вузька одноколонкова форма `max-w-lg`;
- загальні поля без card container;
- два fieldset-блоки для замовлення й intake-етапу;
- upload файлів;
- office-based UK/PL labels.

### Lead detail

- back link, ім’я, office/source/external id;
- дві картки: контакти та action panel;
- нижче форма коментаря, коментарі за статусом, історія подій;
- attachments вкладені в contact card.

Поточна ієрархія слабко відрізняє:

- статус і urgency;
- контактну інформацію;
- primary next action;
- intake data;
- activity timeline;
- технічний audit log.

### Projects list

- office select;
- chips майже для всіх етапів;
- таблиця: етап, клієнт, продукт, оновлено;
- stale approval badge;
- pagination.

При десяти етапах status chips займають багато горизонтального місця й
погано масштабуються.

### Project detail

- back link, клієнт, office і поточний етап;
- client card + status action card;
- project edit form + comments;
- documents нижче окремою карткою.

Поточні проблеми композиції:

- pipeline не видно;
- project data одночасно є view та edit form;
- фінанси, тип продукту, прапорець «Тільки замір» і uploads змішані;
- comments не відокремлюють системні status messages;
- terminal project замінює всю форму одним текстовим повідомленням, тому
  збережені дані фактично не показуються в цьому блоці;
- `otherFiles` обчислюються, але не рендеряться в documents section.

### Dashboard

- чотири KPI cards;
- два текстові списки: ліди за статусом і проєкти за етапом;
- немає trend, period filter, conversion, loss breakdown або charts;
- виглядає як технічний summary, не як операційний центр.

### Users

- таблиці, згруповані за офісом;
- create/edit форми;
- окремі destructive panels;
- цей розділ стилістично повторює загальні cards/tables/forms.

## 7. Поточна візуальна система

### Design system v0.1

З 2026-06-11 є окрема сторінка `/app/design`, доступ до якої показується
`super_admin` у header. Сторінка не змінює поточні lead/project screens і є
еталоном для їхньої поступової міграції.

Напрям:

- структура, щільність і application shell натхненні Supabase;
- нейтральні майже білі surfaces, тонкі borders, controls 28–36 px;
- мінімальні shadows і радіуси 6–8 px;
- semantic green адаптований під KOLSS, а не скопійований із бренду Supabase;
- status colors використовуються лише за значенням;
- desktop sidebar + topbar, mobile як окрема композиція;
- один primary action у локальному контексті.

Поточне покриття каталогу:

- semantic tokens, typography, radius, elevation;
- buttons, icon buttons, badges;
- inputs, selects, textarea, checkbox, radio, validation states;
- topbar, sidebar, tabs, search і filters;
- metric, entity, action та settings cards;
- lead table, pagination, activity timeline, file rows;
- project pipeline, lead next action, callback reminder;
- success, warning, error, empty та loading states.

Код:

- `src/components/ui/design-system.tsx` — primitives;
- `src/app/app/design/page.tsx` — showcase і CRM patterns;
- `src/app/globals.css` — `--ds-*` semantic tokens.

### Typography

- Geist через `next/font/google`;
- одна sans-serif family;
- основні page titles: 24 px, semibold;
- body та tables: переважно 14 px;
- немає окремої display або brand typography.

### Color tokens

```css
--background: #f8f7f4;
--foreground: #1a1a1a;
--card: #ffffff;
--border: #e5e2db;
--accent: #2d4a3e;
--accent-hover: #1f3329;
--muted: #6b6560;
```

Семантичні кольори не токенізовані:

- amber використовується для reminders;
- red — для errors і destructive actions;
- success, info та окремі status colors відсутні.

### Shape and spacing

- cards: `rounded-xl`, 1 px border, white background;
- controls/buttons: `rounded-lg`;
- card padding: переважно 16 px;
- page vertical rhythm: 24–32 px;
- shadow майже ніде не використовується;
- UI плаский, спокійний і нейтральний.

### Components

Є лише один базовий UI component:

- `Button` з `primary`, `secondary`, `ghost`.

Немає спільних компонентів для:

- input/select/textarea;
- field/label/help/error;
- card/section;
- badge/status;
- tabs/filter chips;
- table/data row;
- page header;
- empty/error state;
- alert;
- breadcrumbs;
- modal/drawer;
- timeline/activity item;
- file item;
- pipeline/progress.

Через це класи форм, cards і таблиць повторюються в багатьох файлах.

## 8. Interaction states

Реалізовано:

- pending text у submit buttons;
- disabled opacity;
- inline error text;
- loading skeletons для основних list/detail routes;
- empty text у таблицях;
- row hover;
- basic button hover.

Системно відсутні або непослідовні:

- focus і focus-visible states;
- success confirmation/toast;
- unsaved changes state;
- destructive confirmation pattern поза admin forms;
- skeletons, що точно повторюють майбутній layout;
- disabled reason/helper text;
- optimistic updates;
- hover/focus для table row як цілісного clickable object;
- pressed/selected state tokens;
- consistent validation placement і `role="alert"`.

## 9. Responsive та accessibility audit

### Responsive

- grids переходять у 1 колонку на малих екранах;
- header не має breakpoint-specific поведінки;
- таблиці загорнуті в `overflow-hidden`, а не `overflow-x-auto`;
- status chips просто переносяться;
- немає mobile card representation для lists;
- довгі назви етапів і польські підписи можуть ламати щільність;
- touch targets у filter chips мають малу вертикальну висоту.

### Accessibility

Позитивне:

- використовуються semantic `table`, `form`, `label`, `fieldset`, headings;
- office filter має `aria-label`;
- частина помилок має `role="alert"`.

Проблеми:

- немає явних focus styles;
- active navigation не позначена;
- status часто передається лише текстом без семантичного badge pattern;
- не всі errors мають live-region/alert semantics;
- icon-less UI поки не має проблем з accessible icon labels, але це треба
  врахувати при додаванні іконок;
- можливе горизонтальне обрізання tables;
- contrast треба перевіряти після розширення palette.

## 10. Головний дизайн-борг

Пріоритет 1 — операційна ясність:

- чітко показувати current status, urgency та одну головну наступну дію;
- відділити primary, secondary і destructive actions;
- зробити списки сканованими, а не лише табличними;
- показати pipeline проєкту;
- не ховати важливі дані в неструктурованих paragraphs.

Пріоритет 2 — системність:

- створити semantic tokens;
- уніфікувати form controls, cards, badges, page headers і states;
- прибрати повторення ad hoc Tailwind classes;
- визначити density scale для CRM.

Пріоритет 3 — адаптивність:

- desktop-first для робочих таблиць, але з повноцінним mobile fallback;
- mobile navigation;
- стійкі filters;
- довгі UK/PL labels без обрізання ключового змісту.

Пріоритет 4 — характер бренду:

- поточний warm background + deep green добре відповідають меблевому бізнесу;
- напрям можна розвивати як refined workshop / material-led utility;
- декоративність не повинна знижувати швидкість сканування CRM;
- остаточний visual direction треба затвердити на конкретній дизайн-задачі.

## 11. Робочі принципи для редизайну

Поки користувач не задав інше:

1. Зберігати спокійний, професійний, не generic-SaaS характер.
2. Відштовхуватися від матеріальності меблевого бренду, а не від випадкових
   gradient/dashboard шаблонів.
3. Будувати hierarchy через typography, spacing, grouping і semantic color.
4. Оптимізувати щоденну швидкість менеджера, а не кількість декоративних
   елементів.
5. Один екран має підказувати одну очевидну next best action.
6. Не змішувати редизайн UI зі зміною lead/project flow без явної задачі.
7. Нові компоненти мають бути reusable і сумісними з Server Components.
8. Усі рішення перевіряти для Kyiv/Warsaw labels, ролей і empty/error/loading
   states.
9. Desktop і mobile розглядати як окремі композиції, а не лише responsive
   stacking.
10. Не приховувати дані terminal records: read-only state має залишатися
    повноцінним detail view.

## 12. Карта ключових файлів

- `src/app/globals.css` — tokens і global typography.
- `src/app/layout.tsx` — font та metadata.
- `src/app/app/layout.tsx` — shell і width.
- `src/components/app-header.tsx` — global navigation.
- `src/components/ui/button.tsx` — єдиний базовий UI component.
- `src/app/app/leads/page.tsx` — leads list.
- `src/app/app/leads/[id]/page.tsx` — lead detail composition.
- `src/components/lead-actions-panel.tsx` — lead status actions.
- `src/components/create-lead-form.tsx` — manual lead intake.
- `src/app/app/projects/page.tsx` — projects list.
- `src/app/app/projects/[id]/page.tsx` — project detail composition.
- `src/components/project-status-form.tsx` — project transition actions.
- `src/components/project-form.tsx` — project edit fields and uploads.
- `src/app/app/dashboard/page.tsx` — dashboard.
- `src/app/app/design/page.tsx` — живий каталог дизайн-системи.
- `src/components/admin/*` — user administration patterns.
- `src/components/ui/design-system.tsx` — design system v0.1 primitives.
- `src/lib/lead-form-options.ts` — UK/PL intake labels.
- `src/lib/crm-options.ts` — product and loss labels.
- `PROJECT.md` — актуальна бізнес-логіка та архітектура.

## 13. Питання для майбутнього discovery

Не блокують першу дизайн-задачу, але вплинуть на систему:

- Який пристрій є основним: desktop, laptop чи phone?
- Скільки лідів і проєктів менеджер обробляє за день?
- Які 3–5 полів вирішальні при скануванні списку?
- Чи потрібен quick call/copy phone action?
- Чи має assignee бути видимим і змінюваним?
- Чи потрібна повна польська локалізація shell/navigation?
- Чи існує KOLSS brand book, logo, typeface та product photography?
- Який status або reminder вважається найкритичнішим?
- Чи потрібні saved filters/search/sort?
- Чи мають системні події та людські коментарі бути окремими timelines?
- Які project documents потрібні крім договору й акту?
- Чи має dashboard бути управлінським або щоденним операційним екраном?
