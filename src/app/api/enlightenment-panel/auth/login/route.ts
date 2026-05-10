import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { ADMIN_EMAIL, ensureDefaultFirebaseAdmin, signInWithFirebasePassword } from "@/lib/firebaseAuth";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        if (normalizedEmail !== ADMIN_EMAIL) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const admin = await ensureDefaultFirebaseAdmin();
        const firebaseUser = await signInWithFirebasePassword(normalizedEmail, password);
        if (firebaseUser.localId !== admin.localId) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

        // Use NextAuth's own encode() so getServerSession() can decode it correctly
        const secret = process.env.NEXTAUTH_SECRET!;
        const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds

        const token = await encode({
            token: {
                sub: firebaseUser.localId,
                id: firebaseUser.localId,
                email: normalizedEmail,
                name: "ZenCult Admin",
                role: "admin",
            },
            secret,
            maxAge,
        });

        const isProduction = process.env.NODE_ENV === "production";
        const cookieName = isProduction
            ? "__Secure-next-auth.session-token"
            : "next-auth.session-token";

        const response = NextResponse.json({ ok: true });
        response.cookies.set({
            name: cookieName,
            value: token,
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge,
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("Admin login error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
