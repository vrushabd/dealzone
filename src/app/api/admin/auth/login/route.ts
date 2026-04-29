import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Build a NextAuth-compatible JWT (HS256)
        const now = Math.floor(Date.now() / 1000);
        const exp = now + 30 * 24 * 60 * 60; // 30 days

        const token = await new SignJWT({
            id: admin.id,
            email: admin.email,
            role: "admin",
            sub: admin.id,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt(now)
            .setExpirationTime(exp)
            .sign(SECRET);

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
            maxAge: 30 * 24 * 60 * 60,
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("Admin login error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
