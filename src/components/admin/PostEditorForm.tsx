"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import {
    ArrowLeft,
    Eye,
    FileText,
    Image as ImageIcon,
    Loader2,
    Save,
} from "lucide-react";

export interface EditablePost {
    id?: string;
    title: string;
    slug?: string;
    excerpt?: string | null;
    content: string;
    image?: string | null;
    published: boolean;
}

export default function PostEditorForm({
    initial,
    mode,
}: {
    initial?: EditablePost | null;
    mode: "create" | "edit";
}) {
    const router = useRouter();
    const [form, setForm] = useState({
        title: initial?.title || "",
        excerpt: initial?.excerpt || "",
        content: initial?.content || "",
        image: initial?.image || "",
        published: initial?.published || false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const slugPreview = useMemo(
        () => slugify(form.title || initial?.slug || "untitled-post", { lower: true, strict: true }),
        [form.title, initial?.slug]
    );

    const wordCount = useMemo(() => {
        const words = form.content.trim().split(/\s+/).filter(Boolean);
        return words.length;
    }, [form.content]);

    const setField = (key: keyof typeof form, value: string | boolean) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const endpoint = mode === "edit" && initial?.id ? `/api/posts/${initial.id}` : "/api/posts";
            const method = mode === "edit" ? "PUT" : "POST";
            const response = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.error || "Failed to save post");
            }

            router.push("/admin/posts");
            router.refresh();
        } catch (submitError: unknown) {
            setError(submitError instanceof Error ? submitError.message : "Failed to save post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-base)]">
            <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur">
                <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Link
                            href="/admin/posts"
                            className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[hsl(214_89%_55%)]"
                        >
                            <ArrowLeft size={16} />
                            Back to posts
                        </Link>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                            {mode === "edit" ? "Edit Post" : "New Post"}
                        </h1>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            Write, review, and publish without the cramped modal.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {mode === "edit" && initial?.slug && initial.published ? (
                            <Link
                                href={`/blog/${initial.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                            >
                                <Eye size={16} />
                                Preview Live
                            </Link>
                        ) : null}

                        <button
                            type="submit"
                            form="post-editor-form"
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-md bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[var(--brand-dim)] disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Post"}
                        </button>
                    </div>
                </div>
            </div>

            <form
                id="post-editor-form"
                onSubmit={handleSubmit}
                className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 xl:px-10"
            >
                <div className="space-y-6">
                    {error ? (
                        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    ) : null}

                    <section className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-5">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            Post Title
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(event) => setField("title", event.target.value)}
                            placeholder="Write a headline that makes someone click"
                            required
                            className="input-base mb-3 text-lg font-semibold"
                        />
                        <div className="text-xs text-[var(--text-muted)]">
                            Slug preview: <span className="font-medium text-[var(--text-secondary)]">/blog/{slugPreview || "untitled-post"}</span>
                        </div>
                    </section>

                    <section className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-5">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            Excerpt
                        </label>
                        <textarea
                            value={form.excerpt}
                            onChange={(event) => setField("excerpt", event.target.value)}
                            placeholder="Summarize the post in one crisp paragraph for listing cards and search."
                            rows={4}
                            className="input-base resize-y"
                        />
                    </section>

                    <section className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Content
                            </label>
                            <div className="text-xs text-[var(--text-muted)]">{wordCount} words</div>
                        </div>
                        <textarea
                            value={form.content}
                            onChange={(event) => setField("content", event.target.value)}
                            placeholder="Write your post here..."
                            required
                            rows={24}
                            className="input-base min-h-[60vh] resize-y font-mono text-sm leading-6"
                        />
                    </section>
                </div>

                <aside className="space-y-6">
                    <section className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                            <FileText size={16} className="text-[var(--brand)]" />
                            Publishing
                        </div>

                        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
                            <div>
                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                    {form.published ? "Published" : "Draft"}
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">
                                    {form.published ? "Visible on the public blog." : "Saved privately until you publish it."}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setField("published", !form.published)}
                                className={`relative h-6 w-11 rounded-full transition-colors ${form.published ? "bg-[var(--brand)]" : "bg-[var(--border)]"}`}
                                aria-label="Toggle publish status"
                            >
                                <span
                                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.published ? "left-[22px]" : "left-0.5"}`}
                                />
                            </button>
                        </label>
                    </section>

                    <section className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                            <ImageIcon size={16} className="text-[var(--brand)]" />
                            Featured Image
                        </div>
                        <input
                            type="url"
                            value={form.image}
                            onChange={(event) => setField("image", event.target.value)}
                            placeholder="https://..."
                            className="input-base"
                        />
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                            Add a public image URL for the blog card and post header.
                        </p>
                    </section>
                </aside>
            </form>
        </div>
    );
}
