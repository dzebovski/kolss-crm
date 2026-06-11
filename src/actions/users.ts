"use server";

import { revalidatePath } from "next/cache";
import { assertSuperAdminAction } from "@/lib/auth";
import { ASSIGNABLE_ROLES } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import type { AdminUserRow, Office, Profile, UserRole } from "@/lib/types/database";

const MIN_PASSWORD_LENGTH = 12;
const BAN_DURATION = "876000h";

function requireServiceRole() {
  if (!getSupabaseServiceRoleKey()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY не знайдено. Додайте ключ у .env.local"
    );
  }
}

function parseOfficeIds(formData: FormData): string[] {
  return formData.getAll("office_ids").map(String).filter(Boolean);
}

function parseRole(formData: FormData): UserRole {
  const role = String(formData.get("role") ?? "");
  if (!ASSIGNABLE_ROLES.includes(role as UserRole)) {
    throw new Error("Невірна роль");
  }
  return role as UserRole;
}

function validateUserInput(opts: {
  role: UserRole;
  officeIds: string[];
  password?: string;
  passwordConfirm?: string;
  requirePassword: boolean;
}) {
  const { role, officeIds, password, passwordConfirm, requirePassword } = opts;

  if (role === "curator" && officeIds.length < 2) {
    throw new Error("Куратор має мати доступ щонайменше до двох офісів");
  }
  if (role !== "curator" && officeIds.length < 1) {
    throw new Error("Оберіть хоча б один офіс");
  }

  if (requirePassword) {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Пароль має містити щонайменше ${MIN_PASSWORD_LENGTH} символів`);
    }
    if (password !== passwordConfirm) {
      throw new Error("Паролі не збігаються");
    }
  } else if (password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Пароль має містити щонайменше ${MIN_PASSWORD_LENGTH} символів`);
    }
    if (password !== passwordConfirm) {
      throw new Error("Паролі не збігаються");
    }
  }
}

async function syncMemberships(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  officeIds: string[]
) {
  const { error: deleteErr } = await admin
    .from("user_office_memberships")
    .delete()
    .eq("user_id", userId);
  if (deleteErr) throw deleteErr;

  if (officeIds.length === 0) return;

  const { error: insertErr } = await admin.from("user_office_memberships").insert(
    officeIds.map((office_id) => ({ user_id: userId, office_id }))
  );
  if (insertErr) throw insertErr;
}

async function fetchAllAdminUsers(): Promise<AdminUserRow[]> {
  requireServiceRole();
  const admin = createAdminClient();

  const authUsers: { id: string; email?: string }[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    authUsers.push(...data.users.map((u) => ({ id: u.id, email: u.email })));
    if (data.users.length < perPage) break;
    page += 1;
  }

  const userIds = authUsers.map((u) => u.id);
  if (userIds.length === 0) return [];

  const [{ data: profiles }, { data: memberships }, { data: offices }] =
    await Promise.all([
      admin.from("profiles").select("*").in("id", userIds),
      admin
        .from("user_office_memberships")
        .select("user_id, office_id, offices(*)")
        .in("user_id", userIds),
      admin.from("offices").select("*").eq("is_active", true),
    ]);

  const profileById = new Map(
    (profiles as Profile[] | null)?.map((p) => [p.id, p]) ?? []
  );
  const officesByUser = new Map<string, Office[]>();
  for (const m of memberships ?? []) {
    const office = m.offices as unknown as Office | null;
    if (!office) continue;
    const list = officesByUser.get(m.user_id) ?? [];
    list.push(office);
    officesByUser.set(m.user_id, list);
  }

  const officeOrder = new Map(
    (offices as Office[] | null)?.map((o, i) => [o.id, i]) ?? []
  );

  return authUsers
    .map((u) => {
      const profile = profileById.get(u.id);
      if (!profile) return null;
      const userOffices = (officesByUser.get(u.id) ?? []).sort(
        (a, b) => (officeOrder.get(a.id) ?? 0) - (officeOrder.get(b.id) ?? 0)
      );
      return {
        id: u.id,
        email: u.email ?? "",
        profile,
        offices: userOffices,
      };
    })
    .filter((row): row is AdminUserRow => row !== null);
}

export async function listUsers(activeOnly = true): Promise<AdminUserRow[]> {
  await assertSuperAdminAction();
  const rows = await fetchAllAdminUsers();
  return rows.filter((r) =>
    activeOnly ? r.profile.is_active : !r.profile.is_active
  );
}

async function fetchAdminUserById(userId: string): Promise<AdminUserRow | null> {
  requireServiceRole();
  const admin = createAdminClient();

  const { data: authData, error: authError } =
    await admin.auth.admin.getUserById(userId);
  if (authError || !authData.user) return null;

  const [{ data: profile }, { data: memberships }, { data: offices }] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", userId).single(),
      admin
        .from("user_office_memberships")
        .select("user_id, office_id, offices(*)")
        .eq("user_id", userId),
      admin.from("offices").select("*").eq("is_active", true),
    ]);

  if (!profile) return null;

  const officeOrder = new Map(
    (offices as Office[] | null)?.map((o, i) => [o.id, i]) ?? []
  );
  const userOffices = (memberships ?? [])
    .map((m) => m.offices as unknown as Office | null)
    .filter((o): o is Office => o !== null)
    .sort((a, b) => (officeOrder.get(a.id) ?? 0) - (officeOrder.get(b.id) ?? 0));

  return {
    id: authData.user.id,
    email: authData.user.email ?? "",
    profile: profile as Profile,
    offices: userOffices,
  };
}

export async function getUserById(userId: string): Promise<AdminUserRow | null> {
  await assertSuperAdminAction();
  return fetchAdminUserById(userId);
}

export async function createUser(formData: FormData) {
  await assertSuperAdminAction();
  requireServiceRole();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const role = parseRole(formData);
  const officeIds = parseOfficeIds(formData);

  if (!email) throw new Error("Вкажіть email");
  if (!displayName) throw new Error("Вкажіть імʼя");
  validateUserInput({
    role,
    officeIds,
    password,
    passwordConfirm,
    requirePassword: true,
  });

  const admin = createAdminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (createErr) throw createErr;
  if (!created.user) throw new Error("Не вдалося створити користувача");

  const userId = created.user.id;

  const { error: profileErr } = await admin.from("profiles").upsert({
    id: userId,
    role,
    display_name: displayName,
    is_active: true,
    deactivated_at: null,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    throw profileErr;
  }

  try {
    await syncMemberships(admin, userId, officeIds);
  } catch (err) {
    await admin.auth.admin.deleteUser(userId);
    throw err;
  }

  revalidatePath("/app/admin/users");
  return userId;
}

export async function updateUser(userId: string, formData: FormData) {
  await assertSuperAdminAction();
  requireServiceRole();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const role = parseRole(formData);
  const officeIds = parseOfficeIds(formData);

  if (!email) throw new Error("Вкажіть email");
  if (!displayName) throw new Error("Вкажіть імʼя");
  validateUserInput({
    role,
    officeIds,
    password: password || undefined,
    passwordConfirm: passwordConfirm || undefined,
    requirePassword: false,
  });

  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (existingProfile?.role === "super_admin") {
    throw new Error("Неможливо редагувати супер-адміна через цю форму");
  }

  const authUpdate: { email?: string; password?: string; user_metadata?: Record<string, string> } = {
    email,
    user_metadata: { display_name: displayName },
  };
  if (password) authUpdate.password = password;

  const { error: authErr } = await admin.auth.admin.updateUserById(userId, authUpdate);
  if (authErr) throw authErr;

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      role,
      display_name: displayName,
    })
    .eq("id", userId);
  if (profileErr) throw profileErr;

  await syncMemberships(admin, userId, officeIds);

  revalidatePath("/app/admin/users");
  revalidatePath(`/app/admin/users/${userId}`);
}

export async function deactivateUser(userId: string, confirmEmail: string) {
  await assertSuperAdminAction();
  requireServiceRole();

  const admin = createAdminClient();
  const row = await getUserById(userId);
  if (!row) throw new Error("Користувача не знайдено");
  if (row.profile.role === "super_admin") {
    throw new Error("Неможливо деактивувати супер-адміна");
  }
  if (confirmEmail.trim().toLowerCase() !== row.email.toLowerCase()) {
    throw new Error("Email для підтвердження не збігається");
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update({ is_active: false, deactivated_at: new Date().toISOString() })
    .eq("id", userId);
  if (profileErr) throw profileErr;

  const { error: banErr } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: BAN_DURATION,
  });
  if (banErr) throw banErr;

  revalidatePath("/app/admin/users");
  revalidatePath("/app/admin/users/deactivated");
}

export async function reactivateUser(userId: string) {
  await assertSuperAdminAction();
  requireServiceRole();

  const admin = createAdminClient();

  const { error: profileErr } = await admin
    .from("profiles")
    .update({ is_active: true, deactivated_at: null })
    .eq("id", userId);
  if (profileErr) throw profileErr;

  const { error: banErr } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (banErr) throw banErr;

  revalidatePath("/app/admin/users");
  revalidatePath("/app/admin/users/deactivated");
}

export async function deleteUserPermanently(userId: string, confirmEmail: string) {
  await assertSuperAdminAction();
  requireServiceRole();

  const admin = createAdminClient();
  const row = await getUserById(userId);
  if (!row) throw new Error("Користувача не знайдено");
  if (row.profile.is_active) {
    throw new Error("Спочатку деактивуйте користувача");
  }
  if (row.profile.role === "super_admin") {
    throw new Error("Неможливо видалити супер-адміна");
  }
  if (confirmEmail.trim().toLowerCase() !== row.email.toLowerCase()) {
    throw new Error("Email для підтвердження не збігається");
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;

  revalidatePath("/app/admin/users");
  revalidatePath("/app/admin/users/deactivated");
}
