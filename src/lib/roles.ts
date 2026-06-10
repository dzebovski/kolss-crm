import type { UserRole } from "@/lib/types/database";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Супер-адмін",
  curator: "Куратор",
  office_admin: "Адмін офісу",
  office_member: "Менеджер",
};

export const ASSIGNABLE_ROLES: UserRole[] = [
  "curator",
  "office_admin",
  "office_member",
];

export function roleLabel(role: UserRole | string | null | undefined): string {
  if (!role) return "—";
  return ROLE_LABELS[role as UserRole] ?? role;
}

export function canManageUsers(role: string | null | undefined): boolean {
  return role === "super_admin";
}

export function hasOfficeLeadFilter(role: string | null | undefined): boolean {
  return role === "super_admin" || role === "curator";
}
