import { randomUUID } from 'crypto';

import { FirestoreAdapter } from '@auth/firebase-adapter';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import NextAuth, { Profile, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';

const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';
if (useEmulators) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

// adminDB is used by the guest provider to create ephemeral user records
let adminDB: Firestore | null = null;

const firestoreAdapter = (() => {
  if (useEmulators) {
    const app = getApps().length === 0 ? initializeApp({ projectId: 'demo-pop' }) : getApps()[0];
    adminDB = getFirestore(app);
    return FirestoreAdapter(adminDB);
  }
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? JSON.parse(process.env.FIREBASE_PRIVATE_KEY) : undefined;
  if (!projectId || !clientEmail || !privateKey) return undefined;
  const app =
    getApps().length === 0 ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }) : getApps()[0];
  adminDB = getFirestore(app);
  return FirestoreAdapter(adminDB);
})();

const providers: NextAuthOptions['providers'] = [];

if (useEmulators) {
  providers.push(
    CredentialsProvider({
      name: 'Dev Account',
      credentials: {
        name: { label: 'Name', type: 'text', placeholder: 'Alice' },
      },
      async authorize(credentials) {
        const name = credentials?.name ?? 'Alice';
        const validUsers = ['alice', 'bob', 'charlie', 'david', 'eve', 'frank'];
        const id = validUsers.includes(name.toLowerCase()) ? name.toLowerCase() : 'alice';
        return {
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          email: `${id}@demo.local`,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
        };
      },
    })
  );
} else {
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
}

// Guest provider: available in all environments.
// Creates an ephemeral user record in Firestore so the rest of the join flow
// (JoinGameService) can look up the user as normal.
providers.push(
  CredentialsProvider({
    id: 'guest',
    name: 'Guest',
    credentials: {
      name: { label: 'Nickname', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.name || !adminDB) return null;
      const guestId = `guest_${randomUUID()}`;
      await adminDB.collection('users').doc(guestId).set({
        name: credentials.name,
        image: null,
        isGuest: true,
      });
      return {
        id: guestId,
        name: credentials.name,
        image: null,
        isGuest: true,
      };
    },
  })
);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  session: { strategy: 'jwt' },
  ...(useEmulators || !firestoreAdapter ? {} : { adapter: firestoreAdapter }),
  callbacks: {
    async jwt({ token, user }) {
      if (user?.isGuest) {
        token.isGuest = true;
      }
      return token;
    },
    async session({ session, token, user }) {
      if (token) {
        session.user.id = token.sub ?? '';
        session.user.isGuest = token.isGuest ?? false;
      } else if (user) {
        session.user.id = user.id;
        session.user.isGuest = false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (!firestoreAdapter?.updateUser || !account || !profile) return;
      const newImage = (profile as Profile).image;
      if (newImage && newImage !== user.image) {
        await firestoreAdapter.updateUser({ id: user.id, image: newImage });
      }
    },
  },
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
