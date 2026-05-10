import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin, REVIEW_BUCKET } from '@/lib/supabase';



// POST /api/reviews/upload — upload image to Supabase, return public URL
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate type and size (max 5 MB)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF images allowed' }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 });
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `reviews/${session.user.id}/${Date.now()}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from(REVIEW_BUCKET)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('[review-upload]', uploadError);
            return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 });
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from(REVIEW_BUCKET)
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrlData.publicUrl });
    } catch (err) {
        console.error('[review-upload]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
