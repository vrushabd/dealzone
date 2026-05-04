import { NextRequest, NextResponse } from "next/server";
import { createFirebaseUser, syncFirebaseUserToPrisma } from "@/lib/firebaseAuth";

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, phone } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        const firebaseUser = await createFirebaseUser({
            email: String(email).trim().toLowerCase(),
            password,
            displayName: name.trim(),
        });
        const user = await syncFirebaseUserToPrisma({
            firebaseUid: firebaseUser.localId,
            email: firebaseUser.email || String(email).trim().toLowerCase(),
            name: name.trim(),
            phone: phone || null,
        });

        return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
    } catch (err) {
        console.error("[register]", err);
        const message = err instanceof Error && err.message === "EMAIL_EXISTS"
            ? "An account with this email already exists"
            : "Registration failed";
        return NextResponse.json({ error: message }, { status: message.includes("already") ? 409 : 500 });
    }
}
