import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PostEditorForm from "@/components/admin/PostEditorForm";
import { authOptions } from "@/lib/auth";

export default async function NewAdminPostPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/admin/login");
    }

    return <PostEditorForm mode="create" />;
}
