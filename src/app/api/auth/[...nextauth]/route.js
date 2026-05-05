import { FirestoreAdapter } from '@auth/firebase-adapter';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';

// When using emulators, tell the Admin SDK to connect to the Firestore emulator
const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';
if (useEmulators) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

// In emulator mode, firebase-admin needs no real credentials — just a projectId.
// When FIRESTORE_EMULATOR_HOST is set, it auto-connects to the local emulator.
let firestoreAdapter;
if (useEmulators) {
  const adminApp = getApps().length === 0 ? initializeApp({ projectId: 'demo-pop' }) : getApps()[0];
  firestoreAdapter = FirestoreAdapter(getFirestore(adminApp));
} else {
  firestoreAdapter = FirestoreAdapter({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? JSON.parse(process.env.FIREBASE_PRIVATE_KEY) : undefined,
    }),
  });
}

// Build providers list — in emulator mode, add a dev-only credentials provider
// so you can sign in without real OAuth.
const providers = [];
if (useEmulators) {
  providers.push(
    CredentialsProvider({
      name: 'Dev Account',
      credentials: {
        name: { label: 'Name', type: 'text', placeholder: 'Alice' },
      },
      async authorize(credentials) {
        const name = credentials?.name || 'Alice';
        // Return a mock user — the id must match a seeded user for full functionality
        return {
          id: name.toLowerCase() === 'bob' ? 'user_bob' : 'user_alice',
          name,
          email: `${name.toLowerCase()}@demo.local`,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.toLowerCase()}`,
        };
      },
    })
  );
}
providers.push(
  GoogleProvider({
    clientId: process.env.AUTH_GOOGLE_ID ?? '',
    clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
  }),
  DiscordProvider({
    clientId: process.env.AUTH_DISCORD_ID ?? '',
    clientSecret: process.env.AUTH_DISCORD_SECRET ?? '',
  })
);

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  // CredentialsProvider doesn't work with database adapters by default,
  // so we use JWT strategy in emulator mode and database strategy in production.
  session: { strategy: useEmulators ? 'jwt' : 'database' },
  ...(useEmulators ? {} : { adapter: firestoreAdapter }),
  callbacks: {
    async session({ session, token, user }) {
      // In JWT mode (emulators), user info is in `token`; in DB mode, it's in `user`
      if (token) {
        session.user.id = token.sub;
      } else if (user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
export const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
