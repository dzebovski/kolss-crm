import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type IconName =
  | "arrow-right"
  | "bell"
  | "briefcase"
  | "calendar"
  | "check"
  | "chevron-down"
  | "clock"
  | "file"
  | "filter"
  | "grid"
  | "inbox"
  | "layout"
  | "mail"
  | "more"
  | "phone"
  | "plus"
  | "search"
  | "settings"
  | "sparkles"
  | "user"
  | "users"
  | "x";

const iconPaths: Record<IconName, ReactNode> = {
  "arrow-right": (
    <>
      <path d="M3.5 8h9" />
      <path d="m9.5 4.5 3.5 3.5-3.5 3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M4.5 6.5a3.5 3.5 0 0 1 7 0c0 4 1.5 4.5 1.5 4.5H3s1.5-.5 1.5-4.5Z" />
      <path d="M6.5 13h3" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2.5" y="4.5" width="11" height="8.5" rx="1.5" />
      <path d="M6 4.5v-1A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1" />
      <path d="M2.5 8h11" />
    </>
  ),
  calendar: (
    <>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M5 2v3M11 2v3M2.5 6.5h11" />
    </>
  ),
  check: <path d="m3.5 8 3 3 6-6" />,
  "chevron-down": <path d="m4 6 4 4 4-4" />,
  clock: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 4.5V8l2.5 1.5" />
    </>
  ),
  file: (
    <>
      <path d="M4 2.5h5l3 3V13.5H4z" />
      <path d="M9 2.5v3h3M6 8h4M6 10.5h4" />
    </>
  ),
  filter: (
    <>
      <path d="M2.5 4h11M4.5 8h7M6.5 12h3" />
    </>
  ),
  grid: (
    <>
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
      <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
      <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
      <rect x="9" y="9" width="4.5" height="4.5" rx="1" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 3h9l1.5 7.5v2H2v-2z" />
      <path d="M2.5 9.5h3l1 1.5h3l1-1.5h3" />
    </>
  ),
  layout: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
      <path d="M2.5 6h11M6 6v7.5" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" />
      <path d="m3 5 5 4 5-4" />
    </>
  ),
  more: (
    <>
      <circle cx="4" cy="8" r=".75" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8" r=".75" fill="currentColor" stroke="none" />
      <circle cx="12" cy="8" r=".75" fill="currentColor" stroke="none" />
    </>
  ),
  phone: (
    <path d="M5.2 2.8 7 5.4 5.7 6.8c.8 1.7 1.9 2.8 3.6 3.6l1.4-1.3 2.5 1.8-.6 2c-.2.6-.8 1-1.4.9-5-.7-8.3-4-9-9-.1-.6.3-1.2.9-1.4z" />
  ),
  plus: <path d="M8 3v10M3 8h10" />,
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </>
  ),
  settings: (
    <>
      <circle cx="8" cy="8" r="2.25" />
      <path d="M6.7 2.5h2.6l.4 1.6 1 .6 1.6-.5 1.3 2.2-1.2 1.1v1l1.2 1.1-1.3 2.2-1.6-.5-1 .6-.4 1.6H6.7l-.4-1.6-1-.6-1.6.5-1.3-2.2 1.2-1.1v-1L2.4 6.4l1.3-2.2 1.6.5 1-.6z" />
    </>
  ),
  sparkles: (
    <>
      <path d="m6 2 .8 2.2L9 5l-2.2.8L6 8l-.8-2.2L3 5l2.2-.8z" />
      <path d="m11 8 .6 1.6 1.4.6-1.4.6L11 13l-.6-1.6-1.4-.6 1.4-.6z" />
    </>
  ),
  user: (
    <>
      <circle cx="8" cy="5.25" r="2.5" />
      <path d="M3.5 13c.4-2.5 2-3.8 4.5-3.8s4.1 1.3 4.5 3.8" />
    </>
  ),
  users: (
    <>
      <circle cx="6" cy="5.5" r="2.25" />
      <path d="M2.5 12.5c.4-2.2 1.6-3.4 3.5-3.4s3.1 1.2 3.5 3.4" />
      <path d="M10 4a2 2 0 0 1 0 3.8M10.5 9.4c1.7.3 2.7 1.3 3 3.1" />
    </>
  ),
  x: <path d="m4 4 8 8M12 4l-8 8" />,
};

export function DSIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("size-4 shrink-0", className)}
    >
      {iconPaths[name]}
    </svg>
  );
}

type DSButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "icon";
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
  loadingLabel?: string;
};

export function DSButton({
  variant = "secondary",
  size = "md",
  leadingIcon,
  trailingIcon,
  loading = false,
  loadingLabel,
  className,
  children,
  disabled,
  ...props
}: DSButtonProps) {
  const variants = {
    primary:
      "border-[var(--ds-primary-border)] bg-[var(--ds-primary)] text-white shadow-[var(--ds-shadow-button)] hover:border-[var(--ds-primary-hover)] hover:bg-[var(--ds-primary-hover)] hover:shadow-[var(--ds-shadow-button-hover)] active:bg-[var(--ds-primary-pressed)]",
    secondary:
      "border-[var(--ds-border)] bg-[var(--ds-surface-1)] text-[var(--ds-foreground)] shadow-[var(--ds-shadow-button)] hover:border-[var(--ds-border-hover)] hover:bg-[var(--ds-surface-2)] hover:shadow-[var(--ds-shadow-button-hover)] active:bg-[var(--ds-surface-3)]",
    ghost:
      "border-transparent bg-transparent text-[var(--ds-foreground-light)] shadow-none hover:border-[var(--ds-border)] hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-foreground)] active:bg-[var(--ds-surface-3)]",
    destructive:
      "border-[var(--ds-danger-border)] bg-[var(--ds-danger)] text-white shadow-[var(--ds-shadow-button)] hover:border-[var(--ds-danger-hover)] hover:bg-[var(--ds-danger-hover)] hover:shadow-[var(--ds-shadow-button-hover)] active:bg-[var(--ds-danger-pressed)]",
  };
  const sizes = {
    sm: "h-7 gap-1.5 px-2.5 text-xs",
    md: "h-8 gap-2 px-3 text-sm",
    icon: "size-8 p-0",
  };

  return (
    <button
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cx(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border font-medium outline-none transition-[background-color,border-color,color,box-shadow] duration-150 active:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-surface-0)] disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-80"
        />
      ) : (
        leadingIcon && <DSIcon name={leadingIcon} />
      )}
      {loading && loadingLabel ? loadingLabel : children}
      {!loading && trailingIcon && <DSIcon name={trailingIcon} />}
    </button>
  );
}

export type DSBadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple";

const dsToneStyles: Record<
  DSBadgeTone,
  { badge: string; chipInactive: string; chipActive: string }
> = {
  neutral: {
    badge:
      "border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-foreground-light)]",
    chipInactive: "border border-[var(--border)]",
    chipActive: "border-transparent bg-[var(--accent)] text-white",
  },
  accent: {
    badge:
      "border-[var(--ds-accent-border)] bg-[var(--ds-accent-soft)] text-[var(--ds-accent-strong)]",
    chipInactive:
      "border border-[var(--ds-accent-border)] bg-[var(--ds-accent-soft)] text-[var(--ds-accent-strong)]",
    chipActive: "border-transparent bg-[var(--ds-accent-strong)] text-white",
  },
  success: {
    badge:
      "border-[var(--ds-success-border)] bg-[var(--ds-success-soft)] text-[var(--ds-success-strong)]",
    chipInactive:
      "border border-[var(--ds-success-border)] bg-[var(--ds-success-soft)] text-[var(--ds-success-strong)]",
    chipActive: "border-transparent bg-[var(--ds-success-strong)] text-white",
  },
  warning: {
    badge:
      "border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)] text-[var(--ds-warning-strong)]",
    chipInactive:
      "border border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)] text-[var(--ds-warning-strong)]",
    chipActive: "border-transparent bg-[var(--ds-warning-strong)] text-white",
  },
  danger: {
    badge:
      "border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] text-[var(--ds-danger-strong)]",
    chipInactive:
      "border border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] text-[var(--ds-danger-strong)]",
    chipActive: "border-transparent bg-[var(--ds-danger-strong)] text-white",
  },
  info: {
    badge:
      "border-[var(--ds-info-border)] bg-[var(--ds-info-soft)] text-[var(--ds-info-strong)]",
    chipInactive:
      "border border-[var(--ds-info-border)] bg-[var(--ds-info-soft)] text-[var(--ds-info-strong)]",
    chipActive: "border-transparent bg-[var(--ds-info-strong)] text-white",
  },
  purple: {
    badge:
      "border-[var(--ds-purple-border)] bg-[var(--ds-purple-soft)] text-[var(--ds-purple-strong)]",
    chipInactive:
      "border border-[var(--ds-purple-border)] bg-[var(--ds-purple-soft)] text-[var(--ds-purple-strong)]",
    chipActive: "border-transparent bg-[var(--ds-purple-strong)] text-white",
  },
};

export function dsToneChipClasses(tone: DSBadgeTone, active: boolean): string {
  const styles = dsToneStyles[tone];
  return active ? styles.chipActive : styles.chipInactive;
}

type DSBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: DSBadgeTone;
  dot?: boolean;
};

export function DSBadge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...props
}: DSBadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium leading-none",
        dsToneStyles[tone].badge,
        className
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-75" />}
      {children}
    </span>
  );
}

export function DSSurface({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-1)] shadow-[var(--ds-shadow-card)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DSSectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ds-foreground-lighter)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-medium tracking-tight text-[var(--ds-foreground)]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--ds-foreground-light)]">
        {description}
      </p>
    </div>
  );
}

const controlClass =
  "h-9 w-full rounded-md border border-[var(--ds-border-strong)] bg-[var(--ds-surface-1)] px-3 text-sm text-[var(--ds-foreground)] shadow-[var(--ds-shadow-control)] outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-[var(--ds-foreground-lighter)] hover:border-[var(--ds-border-hover)] hover:shadow-[var(--ds-shadow-control-hover)] focus:border-[var(--ds-accent)] focus:ring-2 focus:ring-[var(--ds-focus-soft)] disabled:cursor-not-allowed disabled:bg-[var(--ds-surface-2)] disabled:text-[var(--ds-foreground-lighter)] disabled:shadow-none";

export function DSInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlClass, className)} {...props} />;
}

export function DSSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="group relative">
      <select
        className={cx(
          controlClass,
          "cursor-pointer appearance-none pr-9 hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-3)]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <DSIcon
        name="chevron-down"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ds-foreground-lighter)] transition-colors duration-150 group-hover:text-[var(--ds-foreground)]"
      />
    </div>
  );
}

export function DSTextarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(controlClass, "h-auto min-h-24 resize-y py-2", className)}
      {...props}
    />
  );
}

export function DSField({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[var(--ds-foreground)]">
        {label}
        {required && (
          <span className="text-[var(--ds-danger-strong)]" aria-hidden="true">
            *
          </span>
        )}
      </span>
      {children}
      {(hint || error) && (
        <span
          className={cx(
            "mt-1.5 block text-xs",
            error
              ? "text-[var(--ds-danger-strong)]"
              : "text-[var(--ds-foreground-lighter)]"
          )}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
}

export function DSKeyValue({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(112px,0.7fr)_1.3fr] gap-4 py-2.5 text-sm">
      <dt className="text-[var(--ds-foreground-lighter)]">{label}</dt>
      <dd className="min-w-0 font-medium text-[var(--ds-foreground)]">
        {children}
      </dd>
    </div>
  );
}
