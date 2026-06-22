import { AppHeader } from "@/components/app-header";
import { requireAuth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <AppHeader>{children}</AppHeader>;
}
