import { prisma } from "@/lib/prisma";

const FIREBASE_API_KEY =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    "AIzaSyAdKLRvVHeu5CgleyFR782JF8XLcOX0Uqs";

export const ADMIN_EMAIL = "zencultstore@gmail.com";

function getAdminPassword() {
    const password = process.env.FIREBASE_ADMIN_PASSWORD;
    if (!password) {
        throw new Error("FIREBASE_ADMIN_PASSWORD is not set.");
    }
    return password;
}

type FirebaseAuthResponse = {
    localId: string;
    email?: string;
    displayName?: string;
    idToken: string;
};

type FirebaseLookupResponse = {
    users?: Array<{
        localId: string;
        email?: string;
        displayName?: string;
        photoUrl?: string;
    }>;
};

function firebaseUrl(method: string) {
    return `https://identitytoolkit.googleapis.com/v1/${method}?key=${FIREBASE_API_KEY}`;
}

async function firebaseRequest<T>(method: string, body: Record<string, unknown>) {
    const response = await fetch(firebaseUrl(method), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message || "Firebase authentication failed");
    }

    return data as T;
}

export async function signInWithFirebasePassword(email: string, password: string) {
    return firebaseRequest<FirebaseAuthResponse>("accounts:signInWithPassword", {
        email,
        password,
        returnSecureToken: true,
    });
}

export async function createFirebaseUser(input: {
    email: string;
    password: string;
    displayName?: string;
}) {
    const user = await firebaseRequest<FirebaseAuthResponse>("accounts:signUp", {
        email: input.email,
        password: input.password,
        returnSecureToken: true,
    });

    if (input.displayName) {
        await firebaseRequest("accounts:update", {
            idToken: user.idToken,
            displayName: input.displayName,
            returnSecureToken: false,
        });
    }

    return { ...user, displayName: input.displayName || user.displayName };
}

export async function ensureDefaultFirebaseAdmin() {
    try {
        return await signInWithFirebasePassword(ADMIN_EMAIL, getAdminPassword());
    } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("EMAIL_NOT_FOUND")) {
            throw error;
        }

        return createFirebaseUser({
            email: ADMIN_EMAIL,
            password: getAdminPassword(),
            displayName: "ZenCult Admin",
        });
    }
}

export async function verifyFirebaseIdToken(idToken: string) {
    const result = await firebaseRequest<FirebaseLookupResponse>("accounts:lookup", {
        idToken,
    });
    const user = result.users?.[0];

    if (!user?.localId) {
        throw new Error("Invalid Firebase token");
    }

    return user;
}

export async function syncFirebaseUserToPrisma(input: {
    firebaseUid: string;
    email: string;
    name?: string | null;
    phone?: string | null;
}) {
    return prisma.user.upsert({
        where: { id: input.firebaseUid },
        update: {
            email: input.email,
            name: input.name || input.email,
            ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
        },
        create: {
            id: input.firebaseUid,
            email: input.email,
            name: input.name || input.email,
            phone: input.phone || null,
            password: "firebase-auth",
        },
    });
}
