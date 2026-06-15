import {
  DSBadge,
  DSButton,
  DSField,
  DSIcon,
  DSInput,
  DSKeyValue,
  DSSectionIntro,
  DSSelect,
  DSSurface,
  DSTextarea,
  type IconName,
} from "@/components/ui/design-system";
import { DesignSystemNav } from "@/components/design-system-nav";

const swatches = [
  { name: "Surface 0", value: "#FBFBFA", variable: "--ds-surface-0" },
  { name: "Surface 1", value: "#FFFFFF", variable: "--ds-surface-1" },
  { name: "Surface 2", value: "#F6F6F4", variable: "--ds-surface-2" },
  { name: "Border", value: "#E1E1DD", variable: "--ds-border" },
  { name: "Foreground", value: "#181817", variable: "--ds-foreground" },
  { name: "Muted", value: "#777772", variable: "--ds-foreground-lighter" },
  { name: "KOLSS green", value: "#2D4A3E", variable: "--ds-primary" },
  { name: "Accent soft", value: "#EEF5F1", variable: "--ds-accent-soft" },
];

const inventory: Array<{
  icon: IconName;
  title: string;
  description: string;
  items: string;
}> = [
  {
    icon: "layout",
    title: "Application shell",
    description: "Каркас щоденної роботи менеджера.",
    items: "Topbar, sidebar, breadcrumbs, search, account menu",
  },
  {
    icon: "sparkles",
    title: "Primitives",
    description: "Повторювані атоми інтерфейсу.",
    items: "Buttons, fields, badges, cards, tabs, dropdowns",
  },
  {
    icon: "grid",
    title: "Data display",
    description: "Щільне та швидке сканування даних.",
    items: "Tables, lists, metrics, key-value, files, activity",
  },
  {
    icon: "briefcase",
    title: "CRM patterns",
    description: "Компоненти саме для KOLSS flow.",
    items: "Lead row, project pipeline, reminders, action panel",
  },
];

const leadRows = [
  {
    name: "Олена Коваль",
    phone: "+380 67 412 08 91",
    office: "Київ",
    product: "Кухня",
    status: "Нова заявка",
    tone: "accent" as const,
    time: "12 хв тому",
  },
  {
    name: "Marek Nowak",
    phone: "+48 602 441 092",
    office: "Варшава",
    product: "Гардероб",
    status: "В роботі",
    tone: "info" as const,
    time: "Сьогодні, 10:42",
  },
  {
    name: "Андрій Мельник",
    phone: "+380 93 771 20 04",
    office: "Київ",
    product: "Меблі для дому",
    status: "Передзвонити",
    tone: "warning" as const,
    time: "Прострочено 35 хв",
  },
];

const projectStages = [
  "Потреби",
  "Проєкт",
  "Погодження",
  "Заміри",
  "Договір",
  "Виробництво",
  "Монтаж",
  "Оплата",
];

function PreviewLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--ds-foreground-lighter)]">
      {children}
    </p>
  );
}

function ExampleFrame({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div>
      <PreviewLabel>{label}</PreviewLabel>
      <div
        className={`rounded-lg border border-dashed border-[var(--ds-border-strong)] bg-[var(--ds-surface-0)] p-5 ${className ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function AppShellPreview() {
  const navItems: Array<[IconName, string, boolean]> = [
    ["inbox", "Ліди", true],
    ["briefcase", "Проєкти", false],
    ["grid", "Дашборд", false],
    ["users", "Користувачі", false],
    ["settings", "Налаштування", false],
  ];

  return (
    <DSSurface className="overflow-hidden">
      <div className="flex h-12 items-center justify-between border-b border-[var(--ds-border)] px-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-[var(--ds-primary)] text-white">
            <span className="text-xs font-semibold">K</span>
          </span>
          <span className="text-sm font-semibold">KOLSS</span>
          <span className="text-[var(--ds-border-strong)]">/</span>
          <span className="text-sm text-[var(--ds-foreground-light)]">CRM</span>
          <DSBadge className="ml-1">KYIV</DSBadge>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden h-8 w-52 cursor-pointer items-center gap-2 rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface-1)] px-2.5 text-xs text-[var(--ds-foreground-lighter)] shadow-[var(--ds-shadow-control)] outline-none transition-[background-color,border-color,color,box-shadow] duration-150 hover:border-[var(--ds-border-hover)] hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-foreground-light)] hover:shadow-[var(--ds-shadow-control-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)] md:flex"
          >
            <DSIcon name="search" />
            Пошук
            <kbd className="ml-auto font-mono text-[10px]">⌘ K</kbd>
          </button>
          <DSButton size="icon" variant="ghost" aria-label="Сповіщення">
            <DSIcon name="bell" />
          </DSButton>
          <button
            type="button"
            aria-label="Меню користувача"
            className="grid size-7 cursor-pointer place-items-center rounded-full border border-transparent bg-[var(--ds-surface-3)] text-[10px] font-semibold outline-none transition-[background-color,border-color,box-shadow] hover:border-[var(--ds-border-hover)] hover:bg-[var(--ds-surface-1)] hover:shadow-[var(--ds-shadow-button)] focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)]"
          >
            ДЗ
          </button>
        </div>
      </div>
      <div className="grid min-h-72 md:grid-cols-[184px_1fr]">
        <aside className="hidden border-r border-[var(--ds-border)] bg-[var(--ds-surface-0)] p-2 md:block">
          <nav className="space-y-0.5">
            {navItems.map(([icon, label, active]) => (
              <button
                key={label}
                type="button"
                className={`flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-left text-sm outline-none transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ds-focus)] ${
                  active
                    ? "bg-[var(--ds-surface-3)] font-medium text-[var(--ds-foreground)] hover:bg-[var(--ds-border)]"
                    : "text-[var(--ds-foreground-light)] hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-foreground)]"
                }`}
              >
                <DSIcon name={icon} />
                {label}
                {label === "Ліди" && (
                  <span className="ml-auto text-xs text-[var(--ds-foreground-lighter)]">
                    18
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>
        <div className="p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--ds-foreground-lighter)]">
                Робочий простір / Київ
              </p>
              <h3 className="mt-1 text-xl font-medium tracking-tight">Ліди</h3>
              <p className="mt-1 text-sm text-[var(--ds-foreground-light)]">
                Нові звернення та наступні дії команди.
              </p>
            </div>
            <DSButton variant="primary" leadingIcon="plus">
              Новий лід
            </DSButton>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Нові", "8", "+3 сьогодні"],
              ["В роботі", "14", "5 передзвонів"],
              ["Конверсія", "31%", "+4.2% за місяць"],
            ].map(([label, value, detail]) => (
              <DSSurface
                key={label}
                className="cursor-pointer p-4 transition-[background-color,border-color,box-shadow] duration-150 hover:border-[var(--ds-border-hover)] hover:bg-[var(--ds-surface-0)] hover:shadow-[var(--ds-shadow-button-hover)]"
              >
                <p className="text-xs text-[var(--ds-foreground-lighter)]">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-medium tracking-tight">
                  {value}
                </p>
                <p className="mt-1 text-xs text-[var(--ds-foreground-light)]">
                  {detail}
                </p>
              </DSSurface>
            ))}
          </div>
        </div>
      </div>
    </DSSurface>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="-mx-4 -my-6 min-h-screen bg-[var(--ds-surface-0)] text-[var(--ds-foreground)]">
      <div className="border-b border-[var(--ds-border)] bg-[var(--ds-surface-1)]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-7 sm:py-14">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <DSBadge tone="accent" dot>
                  Design system v0.1
                </DSBadge>
                <span className="font-mono text-[11px] text-[var(--ds-foreground-lighter)]">
                  2026-06-11
                </span>
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
                Інтерфейсна система для щоденної роботи KOLSS CRM
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ds-foreground-light)]">
                Структура й щільність натхненні Supabase: стримані поверхні,
                тонкі межі, компактні controls та сильна інформаційна
                ієрархія. Колір і CRM-патерни адаптовані під KOLSS.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <DSButton variant="primary" leadingIcon="sparkles">
                  Основний напрям
                </DSButton>
                <DSButton leadingIcon="layout">Application shell</DSButton>
                <DSButton leadingIcon="briefcase">CRM patterns</DSButton>
              </div>
            </div>
            <div className="w-full max-w-xs rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-0)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ds-foreground-lighter)]">
                Принципи
              </p>
              <ul className="mt-3 space-y-3 text-sm">
                {[
                  "Одна очевидна головна дія",
                  "Семантичний колір, не декор",
                  "Компактність без втрати читабельності",
                  "Desktop і mobile як окремі композиції",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[var(--ds-accent-soft)] text-[var(--ds-accent-strong)]">
                      <DSIcon name="check" className="size-3" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-7 lg:grid-cols-[172px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <DesignSystemNav />
        </aside>

        <main className="min-w-0">
          <section className="pb-12">
            <DSSectionIntro
              eyebrow="Coverage"
              title="Що має покривати система"
              description="Не лише кольори й кнопки. Для CRM потрібні application shell, щільні data patterns і компоненти, що показують стан процесу та наступну дію."
            />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {inventory.map((item) => (
                <DSSurface key={item.title} className="p-4">
                  <div className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-foreground-light)]">
                      <DSIcon name={item.icon} />
                    </span>
                    <div>
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <p className="mt-1 text-sm text-[var(--ds-foreground-light)]">
                        {item.description}
                      </p>
                      <p className="mt-2 font-mono text-[10px] leading-4 text-[var(--ds-foreground-lighter)]">
                        {item.items}
                      </p>
                    </div>
                  </div>
                </DSSurface>
              ))}
            </div>
          </section>

          <section
            id="foundations"
            className="scroll-mt-10 border-t border-[var(--ds-border)] py-12"
          >
            <DSSectionIntro
              eyebrow="01 / Foundations"
              title="Кольори, типографіка та геометрія"
              description="Supabase тримає більшість UI у нейтральній шкалі, а accent залишає для активного стану та успішної дії. У KOLSS цей акцент тепліший і темніший."
            />

            <div className="mt-8">
              <PreviewLabel>Semantic color tokens</PreviewLabel>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {swatches.map((swatch) => (
                  <DSSurface key={swatch.name} className="overflow-hidden">
                    <div
                      className="h-16 border-b border-[var(--ds-border)]"
                      style={{ background: `var(${swatch.variable})` }}
                    />
                    <div className="p-3">
                      <p className="text-xs font-medium">{swatch.name}</p>
                      <p className="mt-1 font-mono text-[10px] text-[var(--ds-foreground-lighter)]">
                        {swatch.value}
                      </p>
                    </div>
                  </DSSurface>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <ExampleFrame label="Type scale">
                <div className="space-y-5">
                  <div>
                    <p className="text-3xl font-medium tracking-[-0.035em]">
                      Картка проєкту
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-[var(--ds-foreground-lighter)]">
                      DISPLAY / 30 / 36
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-medium tracking-tight">
                      Погодження дизайну
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-[var(--ds-foreground-lighter)]">
                      TITLE / 20 / 28
                    </p>
                  </div>
                  <div>
                    <p className="text-sm leading-6 text-[var(--ds-foreground-light)]">
                      Основний текст для деталей клієнта, описів і коментарів.
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-[var(--ds-foreground-lighter)]">
                      BODY / 14 / 24
                    </p>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ds-foreground-lighter)]">
                    Metadata / labels / system codes
                  </p>
                </div>
              </ExampleFrame>

              <ExampleFrame label="Radius & elevation">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Control", "rounded-md", "6 px"],
                    ["Surface", "rounded-lg", "8 px"],
                    ["Pill", "rounded-full", "999 px"],
                    ["Shadow", "shadow-card", "1–2 px"],
                  ].map(([name, radius, value]) => (
                    <div
                      key={name}
                      className={`${radius} border border-[var(--ds-border)] bg-[var(--ds-surface-1)] p-4 shadow-[var(--ds-shadow-card)]`}
                    >
                      <p className="text-xs font-medium">{name}</p>
                      <p className="mt-2 font-mono text-[10px] text-[var(--ds-foreground-lighter)]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </ExampleFrame>
            </div>
          </section>

          <section
            id="actions"
            className="scroll-mt-10 border-t border-[var(--ds-border)] py-12"
          >
            <DSSectionIntro
              eyebrow="02 / Actions & status"
              title="Кнопки, badges та пріоритет дій"
              description="Primary використовується один раз у локальному контексті. Destructive не конкурує з наступною дією, а status badge завжди має текст, не лише колір."
            />

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <ExampleFrame label="Button hierarchy">
                <div className="flex flex-wrap items-center gap-2">
                  <DSButton variant="primary" leadingIcon="plus">
                    Створити проєкт
                  </DSButton>
                  <DSButton leadingIcon="phone">Подзвонити</DSButton>
                  <DSButton variant="ghost">Скасувати</DSButton>
                  <DSButton variant="destructive">Архівувати</DSButton>
                  <DSButton size="icon" aria-label="Більше дій">
                    <DSIcon name="more" />
                  </DSButton>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <DSButton size="sm" variant="primary">
                    Small
                  </DSButton>
                  <DSButton size="sm">Secondary</DSButton>
                  <DSButton size="sm" disabled>
                    Disabled
                  </DSButton>
                </div>
              </ExampleFrame>

              <ExampleFrame label="Semantic badges">
                <div className="flex flex-wrap gap-2">
                  <DSBadge dot>Чернетка</DSBadge>
                  <DSBadge tone="accent" dot>
                    Нова заявка
                  </DSBadge>
                  <DSBadge tone="info" dot>
                    В роботі
                  </DSBadge>
                  <DSBadge tone="success" dot>
                    Конвертований
                  </DSBadge>
                  <DSBadge tone="warning" dot>
                    Передзвонити
                  </DSBadge>
                  <DSBadge tone="danger" dot>
                    Невдалий
                  </DSBadge>
                </div>
                <p className="mt-5 text-xs leading-5 text-[var(--ds-foreground-lighter)]">
                  Один tone може мати різні labels, але однакове значення:
                  warning завжди означає увагу або дедлайн.
                </p>
              </ExampleFrame>
            </div>
          </section>

          <section
            id="forms"
            className="scroll-mt-10 border-t border-[var(--ds-border)] py-12"
          >
            <DSSectionIntro
              eyebrow="03 / Forms"
              title="Форми як налаштування, а не довгі полотна"
              description="Патерн Supabase: опис секції зліва, редагована surface справа, локальний footer з Cancel/Save. Для CRM це підходить формам проєкту та адміністративним налаштуванням."
            />

            <div className="mt-8 space-y-4">
              <div className="grid gap-5 border-b border-[var(--ds-border)] pb-8 md:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <h3 className="text-sm font-medium">Контактні дані</h3>
                  <p className="mt-1 text-sm leading-5 text-[var(--ds-foreground-light)]">
                    Основний контакт клієнта та канал комунікації.
                  </p>
                </div>
                <DSSurface className="overflow-hidden">
                  <div className="grid gap-4 p-5 sm:grid-cols-2">
                    <DSField label="Імʼя" required>
                      <DSInput defaultValue="Олена Коваль" />
                    </DSField>
                    <DSField label="Телефон" hint="Формат залежить від офісу">
                      <DSInput defaultValue="+380 67 412 08 91" />
                    </DSField>
                    <DSField label="Email">
                      <DSInput type="email" placeholder="name@example.com" />
                    </DSField>
                    <DSField label="Офіс">
                      <DSSelect defaultValue="kyiv">
                        <option value="kyiv">Київ</option>
                        <option value="warsaw">Варшава</option>
                      </DSSelect>
                    </DSField>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-[var(--ds-border)] bg-[var(--ds-surface-0)] px-5 py-3">
                    <DSButton size="sm" variant="ghost">
                      Скасувати
                    </DSButton>
                    <DSButton size="sm" variant="primary">
                      Зберегти
                    </DSButton>
                  </div>
                </DSSurface>
              </div>

              <div className="grid gap-5 pt-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <h3 className="text-sm font-medium">Стани полів</h3>
                  <p className="mt-1 text-sm leading-5 text-[var(--ds-foreground-light)]">
                    Default, hint, error, disabled і multiline.
                  </p>
                </div>
                <DSSurface className="grid gap-4 p-5 sm:grid-cols-2">
                  <DSField
                    label="Орієнтовний бюджет"
                    hint="Число у валюті офісу"
                  >
                    <DSInput placeholder="0.00" inputMode="decimal" />
                  </DSField>
                  <DSField
                    label="Наш прорахунок"
                    error="Вкажіть суму для цієї причини відмови"
                  >
                    <DSInput
                      aria-invalid="true"
                      className="border-[var(--ds-danger-border-soft)] focus:border-[var(--ds-danger-strong)] focus:ring-red-100"
                      placeholder="0.00"
                    />
                  </DSField>
                  <DSField label="Системне поле">
                    <DSInput disabled defaultValue="manual:68c2…" />
                  </DSField>
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-sm transition-colors hover:bg-[var(--ds-surface-2)]">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="size-4 cursor-pointer rounded border-[var(--ds-border-strong)] accent-[var(--ds-primary)]"
                      />
                      Тільки замір
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-sm transition-colors hover:bg-[var(--ds-surface-2)]">
                      <input
                        type="radio"
                        name="contact-method"
                        defaultChecked
                        className="size-4 cursor-pointer accent-[var(--ds-primary)]"
                      />
                      Телефон
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <DSField label="Коментар менеджера">
                      <DSTextarea placeholder="Додайте контекст наступної дії…" />
                    </DSField>
                  </div>
                </DSSurface>
              </div>
            </div>
          </section>

          <section
            id="navigation"
            className="scroll-mt-10 border-t border-[var(--ds-border)] py-12"
          >
            <DSSectionIntro
              eyebrow="04 / Navigation"
              title="Topbar, sidebar, tabs і filters"
              description="Для CRM беремо dashboard-модель Supabase: глобальні речі у topbar, робочі розділи у sidebar, локальні views і filters над даними."
            />
            <div className="mt-8">
              <PreviewLabel>Application shell</PreviewLabel>
              <AppShellPreview />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <ExampleFrame label="Tabs">
                <div className="border-b border-[var(--ds-border)]">
                  <div className="flex gap-5">
                    {["Огляд", "Активність", "Документи", "Історія"].map(
                      (tab, index) => (
                        <button
                          key={tab}
                          type="button"
                          className={`relative -mx-2 cursor-pointer rounded-t-md px-2 pb-2.5 pt-1 text-sm outline-none transition-[background-color,color] duration-150 hover:bg-[var(--ds-surface-2)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ds-focus)] ${
                            index === 0
                              ? "font-medium text-[var(--ds-foreground)] after:absolute after:inset-x-2 after:-bottom-px after:h-px after:bg-[var(--ds-foreground)]"
                              : "text-[var(--ds-foreground-lighter)] hover:text-[var(--ds-foreground)]"
                          }`}
                        >
                          {tab}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </ExampleFrame>

              <ExampleFrame label="Search & filters">
                <div className="flex flex-wrap gap-2">
                  <div className="relative min-w-48 flex-1">
                    <DSIcon
                      name="search"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ds-foreground-lighter)]"
                    />
                    <DSInput className="pl-9" placeholder="Пошук за клієнтом" />
                  </div>
                  <DSButton leadingIcon="filter" trailingIcon="chevron-down">
                    Статус
                  </DSButton>
                  <DSButton trailingIcon="chevron-down">Офіс: усі</DSButton>
                </div>
              </ExampleFrame>
            </div>
          </section>

          <section
            id="cards"
            className="scroll-mt-10 border-t border-[var(--ds-border)] py-12"
          >
            <DSSectionIntro
              eyebrow="05 / Cards"
              title="Картка має одну роль"
              description="Metric, entity, settings і action cards не змішуються. Тонка межа та внутрішні dividers створюють структуру без важких тіней."
            />

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Нові ліди", "8", "За останні 24 години", "accent"],
                ["Передзвони", "5", "2 вже прострочено", "warning"],
                ["Активні проєкти", "24", "6 на погодженні", "info"],
                ["Конверсія", "31%", "+4.2% до травня", "success"],
              ].map(([title, value, detail, tone]) => (
                <DSSurface key={title} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-[var(--ds-foreground-lighter)]">
                      {title}
                    </p>
                    <span
                      className={`mt-1 size-2 rounded-full ${
                        tone === "warning"
                          ? "bg-amber-500"
                          : tone === "info"
                            ? "bg-blue-500"
                            : tone === "success"
                              ? "bg-emerald-500"
                              : "bg-[var(--ds-accent)]"
                      }`}
                    />
                  </div>
                  <p className="mt-3 text-2xl font-medium tracking-tight">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ds-foreground-light)]">
                    {detail}
                  </p>
                </DSSurface>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <DSSurface className="overflow-hidden">
                <div className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <DSBadge tone="info" dot>
                      В роботі
                    </DSBadge>
                    <h3 className="mt-3 text-lg font-medium">Marek Nowak</h3>
                    <p className="mt-1 text-sm text-[var(--ds-foreground-light)]">
                      Гардероб · Варшава
                    </p>
                  </div>
                  <DSButton size="icon" variant="ghost" aria-label="Більше дій">
                    <DSIcon name="more" />
                  </DSButton>
                </div>
                <dl className="divide-y divide-[var(--ds-border)] border-y border-[var(--ds-border)] px-5">
                  <DSKeyValue label="Телефон">+48 602 441 092</DSKeyValue>
                  <DSKeyValue label="Джерело">Meta Lead Ads</DSKeyValue>
                  <DSKeyValue label="Відповідальний">Anna Kowalska</DSKeyValue>
                </dl>
                <div className="flex gap-2 p-4">
                  <DSButton variant="primary" leadingIcon="phone">
                    Подзвонити
                  </DSButton>
                  <DSButton leadingIcon="mail">Написати</DSButton>
                </div>
              </DSSurface>

              <DSSurface className="overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--ds-border)] p-4">
                  <div>
                    <h3 className="text-sm font-medium">Наступна дія</h3>
                    <p className="mt-1 text-xs text-[var(--ds-foreground-light)]">
                      Компонент для lead/project action panel
                    </p>
                  </div>
                  <DSBadge tone="warning" dot>
                    Сьогодні
                  </DSBadge>
                </div>
                <div className="p-5">
                  <div className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--ds-warning-soft)] text-[var(--ds-warning-strong)]">
                      <DSIcon name="phone" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        Передзвонити до 15:30
                      </p>
                      <p className="mt-1 text-sm leading-5 text-[var(--ds-foreground-light)]">
                        Клієнт попросив повернутися після узгодження бюджету.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <DSButton variant="primary">Позначити виконаним</DSButton>
                    <DSButton>Перенести</DSButton>
                  </div>
                </div>
              </DSSurface>
            </div>
          </section>

          <section
            id="data"
            className="scroll-mt-10 border-t border-[var(--ds-border)] py-12"
          >
            <DSSectionIntro
              eyebrow="06 / Data display"
              title="Таблиці для сканування, rows для дій"
              description="У списку статус, клієнт, продукт, офіс і час мають читатися за один погляд. Вся row стає цілісним interactive object, а не лише одне посилання в комірці."
            />

            <div className="mt-8">
              <PreviewLabel>Lead table</PreviewLabel>
              <DSSurface className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-[var(--ds-border)] bg-[var(--ds-surface-0)]">
                    <tr className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ds-foreground-lighter)]">
                      <th className="px-4 py-2.5 font-medium">Клієнт</th>
                      <th className="px-4 py-2.5 font-medium">Статус</th>
                      <th className="px-4 py-2.5 font-medium">Продукт</th>
                      <th className="px-4 py-2.5 font-medium">Офіс</th>
                      <th className="px-4 py-2.5 font-medium">Активність</th>
                      <th className="w-12 px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ds-border)]">
                    {leadRows.map((lead) => (
                      <tr
                        key={lead.name}
                        tabIndex={0}
                        className="group cursor-pointer outline-none transition-colors hover:bg-[var(--ds-surface-2)] focus-visible:bg-[var(--ds-accent-soft)]"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{lead.name}</p>
                          <p className="mt-0.5 text-xs text-[var(--ds-foreground-lighter)]">
                            {lead.phone}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <DSBadge tone={lead.tone} dot>
                            {lead.status}
                          </DSBadge>
                        </td>
                        <td className="px-4 py-3 text-[var(--ds-foreground-light)]">
                          {lead.product}
                        </td>
                        <td className="px-4 py-3 text-[var(--ds-foreground-light)]">
                          {lead.office}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--ds-foreground-lighter)]">
                          {lead.time}
                        </td>
                        <td className="px-3 py-3">
                          <DSButton
                            size="icon"
                            variant="ghost"
                            aria-label={`Дії для ${lead.name}`}
                            className="opacity-60 group-hover:opacity-100"
                          >
                            <DSIcon name="more" />
                          </DSButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t border-[var(--ds-border)] bg-[var(--ds-surface-0)] px-4 py-2.5 text-xs text-[var(--ds-foreground-lighter)]">
                  <span>Показано 1–3 з 24 лідів</span>
                  <div className="flex gap-1">
                    <DSButton size="sm" disabled>
                      Назад
                    </DSButton>
                    <DSButton size="sm">Далі</DSButton>
                  </div>
                </div>
              </DSSurface>
            </div>

            <div className="mt-8">
              <PreviewLabel>Activity & files</PreviewLabel>
              <div className="grid gap-4 lg:grid-cols-2">
                <DSSurface className="p-4">
                  <h3 className="text-sm font-medium">Активність</h3>
                  <ol className="mt-4 space-y-0">
                    {[
                      ["phone", "Не додзвонились", "Сьогодні, 11:20"],
                      ["file", "Додано прорахунок kitchen-v2.pdf", "Вчора, 16:42"],
                      ["check", "Статус змінено на «В роботі»", "Вчора, 10:15"],
                    ].map(([icon, text, time], index) => (
                      <li key={text} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < 2 && (
                          <span className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-px bg-[var(--ds-border)]" />
                        )}
                        <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border border-[var(--ds-border)] bg-[var(--ds-surface-1)] text-[var(--ds-foreground-light)]">
                          <DSIcon name={icon as IconName} />
                        </span>
                        <div className="pt-1">
                          <p className="text-sm">{text}</p>
                          <p className="mt-1 text-xs text-[var(--ds-foreground-lighter)]">
                            {time}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </DSSurface>

                <DSSurface className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--ds-border)] p-4">
                    <h3 className="text-sm font-medium">Документи</h3>
                    <DSButton size="sm" leadingIcon="plus">
                      Додати
                    </DSButton>
                  </div>
                  <div className="divide-y divide-[var(--ds-border)]">
                    {[
                      ["Договір_KOLSS_0142.pdf", "PDF · 1.8 MB", "Договір"],
                      ["Акт_заміру.jpg", "JPG · 840 KB", "Замір"],
                      ["Візуалізація_v2.pdf", "PDF · 5.2 MB", "Проєкт"],
                    ].map(([name, meta, type]) => (
                      <button
                        key={name}
                        type="button"
                        className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-[var(--ds-surface-2)] focus-visible:bg-[var(--ds-accent-soft)]"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface-0)] text-[var(--ds-foreground-light)] transition-[background-color,border-color,color] group-hover:border-[var(--ds-border-hover)] group-hover:bg-[var(--ds-surface-1)] group-hover:text-[var(--ds-foreground)]">
                          <DSIcon name="file" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{name}</p>
                          <p className="mt-0.5 text-xs text-[var(--ds-foreground-lighter)]">
                            {meta}
                          </p>
                        </div>
                        <DSBadge className="ml-auto">{type}</DSBadge>
                      </button>
                    ))}
                  </div>
                </DSSurface>
              </div>
            </div>
          </section>

          <section
            id="crm"
            className="scroll-mt-10 border-t border-[var(--ds-border)] py-12"
          >
            <DSSectionIntro
              eyebrow="07 / CRM patterns"
              title="Компоненти, яких немає в generic UI kit"
              description="Саме ці патерни відрізняють KOLSS CRM від набору красивих controls: pipeline, next action, reminder, client summary і розділення системної та людської активності."
            />

            <div className="mt-8">
              <PreviewLabel>Project pipeline</PreviewLabel>
              <DSSurface className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <DSBadge tone="info" dot>
                        Погодження
                      </DSBadge>
                      <DSBadge tone="warning">Думає 4 дні</DSBadge>
                    </div>
                    <h3 className="mt-3 text-lg font-medium">
                      Кухня · Олена Коваль
                    </h3>
                    <p className="mt-1 text-sm text-[var(--ds-foreground-light)]">
                      Проєкт #K-0142 · Київ
                    </p>
                  </div>
                  <DSButton variant="primary" trailingIcon="arrow-right">
                    Перейти до замірів
                  </DSButton>
                </div>
                <div className="mt-7 overflow-x-auto pb-1">
                  <ol className="flex min-w-[720px]">
                    {projectStages.map((stage, index) => {
                      const completed = index < 2;
                      const current = index === 2;
                      return (
                        <li key={stage} className="relative flex-1">
                          {index < projectStages.length - 1 && (
                            <span
                              className={`absolute left-1/2 right-0 top-3 h-px ${
                                completed
                                  ? "bg-[var(--ds-accent)]"
                                  : "bg-[var(--ds-border)]"
                              }`}
                            />
                          )}
                          {index > 0 && (
                            <span
                              className={`absolute left-0 right-1/2 top-3 h-px ${
                                completed || current
                                  ? "bg-[var(--ds-accent)]"
                                  : "bg-[var(--ds-border)]"
                              }`}
                            />
                          )}
                          <div className="relative z-10 flex flex-col items-center text-center">
                            <span
                              className={`grid size-6 place-items-center rounded-full border text-[10px] font-medium ${
                                completed
                                  ? "border-[var(--ds-accent)] bg-[var(--ds-accent)] text-white"
                                  : current
                                    ? "border-[var(--ds-accent)] bg-[var(--ds-surface-1)] text-[var(--ds-accent-strong)] ring-4 ring-[var(--ds-accent-soft)]"
                                    : "border-[var(--ds-border-strong)] bg-[var(--ds-surface-1)] text-[var(--ds-foreground-lighter)]"
                              }`}
                            >
                              {completed ? (
                                <DSIcon name="check" className="size-3" />
                              ) : (
                                index + 1
                              )}
                            </span>
                            <span
                              className={`mt-2 text-[11px] ${
                                current
                                  ? "font-medium text-[var(--ds-foreground)]"
                                  : "text-[var(--ds-foreground-lighter)]"
                              }`}
                            >
                              {stage}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </DSSurface>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <DSSurface className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Кваліфікація ліда</p>
                    <p className="mt-0.5 text-xs text-[var(--ds-foreground-lighter)]">
                      Одна primary action, решта у secondary hierarchy
                    </p>
                  </div>
                  <DSBadge tone="accent" dot>
                    Нова заявка
                  </DSBadge>
                </div>
                <div className="p-4">
                  <div className="flex gap-3 rounded-md border border-[var(--ds-accent-border)] bg-[var(--ds-accent-soft)] p-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white/70 text-[var(--ds-accent-strong)]">
                      <DSIcon name="phone" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">Наступний крок</p>
                      <p className="mt-1 text-sm text-[var(--ds-foreground-light)]">
                        Зателефонувати та підтвердити тип виробу, місто і
                        орієнтовний бюджет.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <DSButton variant="primary">Взяти в роботу</DSButton>
                    <DSButton>Створити проєкт</DSButton>
                    <DSButton variant="ghost">Невдалий лід</DSButton>
                  </div>
                </div>
              </DSSurface>

              <DSSurface className="p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-md bg-[var(--ds-warning-soft)] text-[var(--ds-warning-strong)]">
                    <DSIcon name="clock" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Передзвонити</p>
                    <p className="mt-0.5 text-xs text-[var(--ds-foreground-lighter)]">
                      Сьогодні до 15:30
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-5 text-[var(--ds-foreground-light)]">
                  Reminder має бути помітним у списку, картці та dashboard, але
                  не змінює статус «В роботі».
                </p>
                <DSButton className="mt-4 w-full" leadingIcon="calendar">
                  Перенести нагадування
                </DSButton>
              </DSSurface>
            </div>
          </section>

          <section
            id="feedback"
            className="scroll-mt-10 border-t border-[var(--ds-border)] py-12"
          >
            <DSSectionIntro
              eyebrow="08 / Feedback & states"
              title="Loading, empty, error і confirmation"
              description="Система вважається готовою лише тоді, коли описані не тільки ideal screens, але й усі робочі стани."
            />

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                {[
                  {
                    icon: "check" as IconName,
                    title: "Зміни збережено",
                    text: "Дані проєкту оновлено.",
                    className:
                      "border-[var(--ds-success-border)] bg-[var(--ds-success-soft)] text-[var(--ds-success-strong)]",
                  },
                  {
                    icon: "clock" as IconName,
                    title: "Потрібна увага",
                    text: "Погодження без активності понад 3 дні.",
                    className:
                      "border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)] text-[var(--ds-warning-strong)]",
                  },
                  {
                    icon: "x" as IconName,
                    title: "Не вдалося зберегти",
                    text: "Перевірте обовʼязкові поля та повторіть.",
                    className:
                      "border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] text-[var(--ds-danger-strong)]",
                  },
                ].map((alert) => (
                  <div
                    key={alert.title}
                    className={`flex gap-3 rounded-lg border p-3.5 ${alert.className}`}
                  >
                    <DSIcon name={alert.icon} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="mt-1 text-xs opacity-80">{alert.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <DSSurface className="grid min-h-56 place-items-center p-6 text-center">
                <div className="max-w-xs">
                  <span className="mx-auto grid size-10 place-items-center rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-0)] text-[var(--ds-foreground-light)]">
                    <DSIcon name="inbox" />
                  </span>
                  <h3 className="mt-4 text-sm font-medium">
                    Немає лідів за цим фільтром
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-[var(--ds-foreground-light)]">
                    Змініть фільтр або створіть новий лід вручну.
                  </p>
                  <DSButton
                    variant="primary"
                    leadingIcon="plus"
                    className="mt-4"
                  >
                    Новий лід
                  </DSButton>
                </div>
              </DSSurface>
            </div>

            <div className="mt-6">
              <PreviewLabel>Loading skeleton</PreviewLabel>
              <DSSurface className="p-4">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 w-52 rounded-md bg-[var(--ds-surface-3)]" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="h-24 rounded-lg bg-[var(--ds-surface-2)]" />
                    <div className="h-24 rounded-lg bg-[var(--ds-surface-2)]" />
                    <div className="h-24 rounded-lg bg-[var(--ds-surface-2)]" />
                  </div>
                  <div className="h-40 rounded-lg bg-[var(--ds-surface-2)]" />
                </div>
              </DSSurface>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
