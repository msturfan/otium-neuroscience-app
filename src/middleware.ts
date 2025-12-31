import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Auth routes that need extra protection
const AUTH_ROUTES = ["/login", "/sign-up", "/forgot-password", "/update-password"];
const API_AUTH_ROUTES = ["/api/auth"];

// Simple in-memory rate limiting for middleware (edge-compatible)
// Note: In production with multiple instances, use Redis or similar
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const MIDDLEWARE_RATE_LIMIT = {
  maxRequests: 60, // requests per window
  windowMs: 60 * 1000, // 1 minute window
};

function getClientIP(request: NextRequest): string {
  // Cloudflare provides the real IP
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // x-forwarded-for (first IP in chain)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  // x-real-ip
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

function checkMiddlewareRateLimit(ip: string, path: string): boolean {
  const now = Date.now();
  const key = `${ip}:${path}`;

  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    requestCounts.set(key, {
      count: 1,
      resetTime: now + MIDDLEWARE_RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (record.count >= MIDDLEWARE_RATE_LIMIT.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIP(request);

  // Apply stricter rate limiting to auth routes
  const isAuthRoute =
    AUTH_ROUTES.some((route) => pathname.startsWith(route)) ||
    API_AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    const allowed = checkMiddlewareRateLimit(ip, "auth");
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }
  }

  // Add security headers
  const response = await updateSession(request);

  // Add security headers to response
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabaseResponse;
}
