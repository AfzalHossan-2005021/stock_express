import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    // Allow an explicit test query param to bypass auth for E2E tests in non-production
    try {
      const url = new URL(request.url);
      const testAnon = url.searchParams.get('testAnonymousId');
      if (testAnon && process.env.NODE_ENV !== 'production') {
        return NextResponse.next();
      }
    } catch (e) {
      // ignore parsing errors
    }

    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets|e2e-test).*)',
  ],
};