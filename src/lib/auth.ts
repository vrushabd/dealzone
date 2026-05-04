import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ADMIN_EMAIL, ensureDefaultFirebaseAdmin, signInWithFirebasePassword } from "./firebaseAuth";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "admin-credentials",
            name: "admin-credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = credentials.email.trim().toLowerCase();
                if (email !== ADMIN_EMAIL) return null;

                const admin = await ensureDefaultFirebaseAdmin();
                const user = await signInWithFirebasePassword(email, credentials.password);

                if (user.localId !== admin.localId) return null;

                return { id: user.localId, email, name: "ZenCult Admin", role: "admin" };
            },
        }),
    ],
    pages: {
        signIn: "/enlightenment-panel",
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
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    id: token.id as string || token.sub as string || "",
                    email: token.email as string,
                    name: token.name as string | undefined,
                    role: token.role as string,
                };
            }
            return session;
        },
    },
};
