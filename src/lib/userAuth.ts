import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
    signInWithFirebasePassword,
    syncFirebaseUserToPrisma,
    verifyFirebaseIdToken,
} from "./firebaseAuth";

/**
 * Separate NextAuth options for CUSTOMER sessions.
 * Admin auth lives in /src/lib/auth.ts and redirects to /enlightenment-panel.
 * Customer auth uses this config and redirects to /login.
 */
export const userAuthOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "user-credentials",
            name: "User Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const firebaseUser = await signInWithFirebasePassword(
                    credentials.email.trim().toLowerCase(),
                    credentials.password
                );

                const user = await syncFirebaseUserToPrisma({
                    firebaseUid: firebaseUser.localId,
                    email: firebaseUser.email || credentials.email.trim().toLowerCase(),
                    name: firebaseUser.displayName || firebaseUser.email || "ZenCult User",
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            },
        }),
        CredentialsProvider({
            id: "firebase-google",
            name: "Google",
            credentials: {
                idToken: { label: "Firebase ID token", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.idToken) return null;

                const firebaseUser = await verifyFirebaseIdToken(credentials.idToken);
                if (!firebaseUser.email) return null;

                const user = await syncFirebaseUserToPrisma({
                    firebaseUid: firebaseUser.localId,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email,
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = "user";
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    id: token.id as string,
                    email: token.email as string,
                    name: token.name as string,
                    role: "user",
                };
            }
            return session;
        },
    },
};
