import { AppHeader } from "@/components/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
