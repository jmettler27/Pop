import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { adminAuth } from '@/firebase/admin';

// Reads the session cookie — never cache.
export const dynamic = 'force-dynamic';

/**
 * Mints a Firebase custom token for the signed-in NextAuth user. The client
 * exchanges it via `signInWithCustomToken` so the Firebase SDK carries an ID
 * token (auto-refreshed) that the Go backend verifies as `Authorization: Bearer`.
 * The `isGuest` claim rides through to `Caller.IsGuest` server-side.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = await adminAuth().createCustomToken(session.user.id, {
    isGuest: session.user.isGuest ?? false,
  });
  return NextResponse.json({ token });
}
