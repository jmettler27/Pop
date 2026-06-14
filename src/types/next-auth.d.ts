import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    isGuest?: boolean;
  }
  interface Session {
    user: { id: string; isGuest?: boolean } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    isGuest?: boolean;
  }
}
