"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, BookOpen, Search, Loader2, Eye } from "lucide-react";

interface Post {
    id: string; title: string; slug: string; excerpt?: string | null;
    content: string; published: boolean; createdAt: string; image?: string | null;
}

export default function AdminPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = async () => {
        try {
            const data = await fetch("/api/posts").then(r => r.json());
            setPosts(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this post?")) return;
        setDeleting(id);
        setLoading(true);
        await fetch(`/api/posts/${id}`, { method: "DELETE" });
        setDeleting(null);
        await load();
    };

    const filtered = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Blog Posts</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{posts.length} posts total</p>
                </div>
                <Link href="/admin/posts/new"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] hover:from-[hsl(214_89%_55%)] hover:to-[hsl(214_89%_52%)] text-white font-semibold px-5 py-2.5 rounded-md transition-all btn-glow text-sm">
                    <Plus size={16} /> New Post
                </Link>
            </div>

            <div className="relative mb-6">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..."
                    className="input-base pl-10 max-w-sm" />
            </div>

            {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-md" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                    {posts.length === 0 ? (
                        <p>No posts yet. <Link href="/admin/posts/new" className="text-[hsl(214_89%_55%)] hover:underline">Write your first post →</Link></p>
                    ) : (
                        <p>No posts match that search yet.</p>
                    )}
                </div>
            ) : (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md overflow-hidden">
                    <div className="divide-y divide-[var(--border)]">
                        {filtered.map((post) => (
                            <div key={post.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-[var(--bg-card-hover)] transition-colors group relative">
                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-medium text-[var(--text-primary)] text-sm line-clamp-1">{post.title}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${post.published ? "bg-green-500/15 text-green-600" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"}`}>
                                            {post.published ? "Published" : "Draft"}
                                        </span>
                                    </div>
                                    {post.excerpt && <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">{post.excerpt}</p>}
                                    <div className="text-xs text-[var(--text-muted)] mt-1">
                                        {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-4 top-4 sm:relative sm:right-auto sm:top-auto">
                                    <a href={`/blog/${post.slug}`} target="_blank" className="p-1.5 text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all">
                                        <Eye size={15} />
                                    </a>
                                    <Link href={`/admin/posts/${post.id}`} className="p-1.5 text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] hover:bg-[hsl(214_89%_52%/0.08)] rounded-lg transition-all">
                                        <Pencil size={15} />
                                    </Link>
                                    <button onClick={() => handleDelete(post.id)} disabled={deleting === post.id}
                                        className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                        {deleting === post.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
