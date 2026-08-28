import { randomUUID } from 'crypto';

import { FirestoreAdapter } from '@auth/firebase-adapter';
import NextAuth, { Profile, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';

import { adminFirestore } from '@/firebase/admin';
import { generateAvatarUrl } from '@/utils/avatar';

const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

// `adminDB` backs the guest provider's ephemeral user records. The NextAuth
// Firestore adapter is only wired into `authOptions` outside the emulators (see
// below), but it is still constructed here so `events.signIn` can use it.
const adminDB = adminFirestore();
const firestoreAdapter = adminDB ? FirestoreAdapter(adminDB) : undefined;

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
          image: generateAvatarUrl(id),
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
      const image = generateAvatarUrl(guestId);
      await adminDB.collection('users').doc(guestId).set({
        name: credentials.name,
        image,
        isGuest: true,
      });
      return {
        id: guestId,
        name: credentials.name,
        image,
        isGuest: true,
      };
    },
  })
);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  pages: { signIn: '/auth/signin' },
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
