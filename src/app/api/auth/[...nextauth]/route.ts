import { FirestoreAdapter } from '@auth/firebase-adapter';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';

const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';
if (useEmulators) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

const firestoreAdapter = useEmulators
  ? FirestoreAdapter(getFirestore(getApps().length === 0 ? initializeApp({ projectId: 'demo-pop' }) : getApps()[0]))
  : FirestoreAdapter({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? JSON.parse(process.env.FIREBASE_PRIVATE_KEY) : undefined,
      }),
    });

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

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  session: { strategy: useEmulators ? 'jwt' : 'database' },
  ...(useEmulators ? {} : { adapter: firestoreAdapter }),
  callbacks: {
    async session({ session, token, user }) {
      if (token) {
        session.user.id = token.sub ?? '';
      } else if (user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
