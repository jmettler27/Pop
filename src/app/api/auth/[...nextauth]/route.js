import NextAuth from "next-auth"

import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import FacebookProvider from "next-auth/providers/facebook";

import { FirestoreAdapter } from "@auth/firebase-adapter"
import { cert } from "firebase-admin/app"

export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        DiscordProvider({
            clientId: process.env.AUTH_DISCORD_ID,
            clientSecret: process.env.AUTH_DISCORD_SECRET,
        }),
        // FacebookProvider({
        //     clientId: process.env.FACEBOOK_CLIENT_ID,
        //     clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        // })
    ],
    adapter: FirestoreAdapter({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY
                ? JSON.parse(process.env.FIREBASE_PRIVATE_KEY)
                : undefined,
        })
    }),
    callbacks: {
        async session(session) {
            session.session.user.id = session.user.id
            return session
        }
    }
}
export const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }