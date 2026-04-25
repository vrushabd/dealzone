import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { userAuthOptions } from "@/lib/userAuth";
import { prisma } from "@/lib/prisma";

// GET — load current profile
export async function GET() {
    const session = await getServerSession(userAuthOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, phone: true, address: true, city: true, state: true, pincode: true },
    });

    return NextResponse.json({ user });
}

// PATCH — save profile / address
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(userAuthOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, phone, address, city, state, pincode } = await req.json();

    if (!name || !phone || !address || !city || !state || !pincode) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!/^\d{6}$/.test(pincode)) {
        return NextResponse.json({ error: "Pincode must be 6 digits" }, { status: 400 });
    }

    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
        return NextResponse.json({ error: "Enter a valid 10-digit phone number" }, { status: 400 });
    }

    const user = await prisma.user.update({
        where: { id: session.user.id },
        data: { name, phone, address, city, state, pincode },
        select: { name: true, phone: true, address: true, city: true, state: true, pincode: true },
    });

    return NextResponse.json({ user });
}
