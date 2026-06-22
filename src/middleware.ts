import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveLocaleFromUser } from "@/lib/locale";
import { defaultLocale, isAppLocale } from "@/i18n/config";
import {
  localeForViewAs,
  viewAsModeFromCookie,
  VIEW_AS_COOKIE,
} from "@/lib/view-as";
import { RETURN_TO_HEADER, safeAppReturnTo } from "@/lib/navigation";
import { resolveVerifiedUser } from "@/lib/supabase/session-user";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return new NextResponse("Service configuration error", { status: 503 });
  }

  let refreshedCookies: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  function nextResponse() {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      RETURN_TO_HEADER,
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    requestHeaders.set("cookie", request.cookies.toString());
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    refreshedCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    return response;
  }

  function redirectResponse(url: URL) {
    const response = NextResponse.redirect(url);
    refreshedCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    return response;
  }

  let supabaseResponse = nextResponse();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        refreshedCookies = cookiesToSet.map(({ name, value, options }) => ({
          name,
          value,
          options: options as Record<string, unknown>,
        }));
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = nextResponse();
      },
    },
  });

  const user = await resolveVerifiedUser(supabase);

  const isApp = request.nextUrl.pathname.startsWith("/app");
  const isLogin = request.nextUrl.pathname === "/login";

  if (isApp && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return redirectResponse(redirectUrl);
  }

  if (isLogin && user) {
    const returnTo = safeAppReturnTo(request.nextUrl.searchParams.get("next"));
    return redirectResponse(new URL(returnTo, request.url));
  }

  if (user && isApp) {
    const existingLocale = request.cookies.get("kolss_locale")?.value;

    if (existingLocale && isAppLocale(existingLocale)) {
      return supabaseResponse;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let locale = defaultLocale;

    if (profile?.role === "super_admin") {
      locale = localeForViewAs(
        viewAsModeFromCookie(
          profile.role,
          request.cookies.get(VIEW_AS_COOKIE)?.value
        ) ?? "super_admin"
      );
    } else if (profile?.role) {
      const { data: memberships } = await supabase
        .from("user_office_memberships")
        .select("offices(code)")
        .eq("user_id", user.id);

      const officeCodes =
        memberships?.map((m) => {
          const office = m.offices as { code: string } | { code: string }[] | null;
          return Array.isArray(office) ? office[0]?.code : office?.code;
        }).filter((c): c is string => Boolean(c)) ?? [];

      locale = resolveLocaleFromUser(profile.role, officeCodes);
    }

    if (isAppLocale(locale)) {
      request.cookies.set("kolss_locale", locale);
      supabaseResponse = nextResponse();
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
