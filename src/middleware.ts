import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveLocaleFromUser } from "@/lib/locale";
import { defaultLocale, isAppLocale } from "@/i18n/config";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return new NextResponse("Service configuration error", { status: 503 });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isApp = request.nextUrl.pathname.startsWith("/app");
  const isLogin = request.nextUrl.pathname === "/login";

  if (isApp && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isLogin && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isApp) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: memberships } = await supabase
      .from("user_office_memberships")
      .select("offices(code)")
      .eq("user_id", user.id);

    const officeCodes =
      memberships?.map((m) => {
        const office = m.offices as { code: string } | { code: string }[] | null;
        return Array.isArray(office) ? office[0]?.code : office?.code;
      }).filter((c): c is string => Boolean(c)) ?? [];

    const locale = profile?.role
      ? resolveLocaleFromUser(profile.role, officeCodes)
      : defaultLocale;

    if (isAppLocale(locale)) {
      supabaseResponse.cookies.set("kolss_locale", locale, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
