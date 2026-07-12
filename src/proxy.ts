import { NextResponse } from 'next/server';

import { withAuth } from 'next-auth/middleware';

// Routes guests can't access even when authenticated; they're bounced back home.
const GUEST_BLOCKED_PREFIXES = ['/edit', '/submit'];

export default withAuth(function middleware(req) {
  const isGuest = Boolean(req.nextauth.token?.isGuest);
  const isGuestBlocked = GUEST_BLOCKED_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix));

  if (isGuest && isGuestBlocked) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/', '/about', '/edit/:path*', '/submit/:path*'],
};
