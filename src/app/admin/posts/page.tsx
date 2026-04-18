"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, BookOpen, Search, X, Loader2, Eye } from "lucide-react";

interface Post {
    id: string; title: string; slug: string; excerpt?: string | null;
    content: string; published: boolean; createdAt: string; image?: string | null;
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-md shadow-2xl animate-fade-in-up">
                {children}
            </div>
        </div>
    );
}

function PostForm({ initial, onSave, onClose }: { initial?: Post | null; onSave: () => void; onClose: () => void }) {
    const [form, setForm] = useState({
        title: initial?.title || "",
        excerpt: initial?.excerpt || "",
        content: initial?.content || "",
        image: initial?.image || "",
        published: initial?.published || false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const url = initial ? `/api/posts/${initial.id}` : "/api/posts";
            const method = initial ? "PUT" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (!res.ok) throw new Error((await res.json()).error);
            onSave();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error saving post");
        } finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-bold text-white">{initial ? "Edit Post" : "New Blog Post"}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors rounded-lg p-1.5 hover:bg-gray-700">
                    <X size={18} />
                </button>
            </div>

            <div className="p-6 space-y-4">
                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-4 py-3 text-sm">{error}</div>}

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Title *</label>
                    <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                        placeholder="Post title..." required className="input-base" />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Excerpt / Summary</label>
                    <input type="text" value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)}
                        placeholder="Short description shown in listings..." className="input-base" />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Featured Image URL</label>
                    <input type="url" value={form.image} onChange={(e) => set("image", e.target.value)}
                        placeholder="https://..." className="input-base" />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Content *</label>
                    <textarea value={form.content} onChange={(e) => set("content", e.target.value)}
                        placeholder="Write your post content here..." required rows={10}
                        className="input-base resize-y font-mono text-xs" />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <div onClick={() => set("published", !form.published)}
                        className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${form.published ? "bg-[hsl(214_89%_52%)]" : "bg-gray-700"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.published ? "left-5" : "left-0.5"}`} />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {form.published ? "Published" : "Draft"}
                    </span>
                </label>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-800">
                <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-md text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={loading}
                    className="flex-1 bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] hover:from-[hsl(214_89%_55%)] hover:to-[hsl(214_89%_52%)] text-white py-2.5 rounded-md text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 size={15} className="animate-spin" />Saving...</> : (initial ? "Save Changes" : "Publish Post")}
                </button>
            </div>
        </form>
    );
}

export default function AdminPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Post | null>(null);
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
                <button onClick={() => { setEditing(null); setModalOpen(true); }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] hover:from-[hsl(214_89%_55%)] hover:to-[hsl(214_89%_52%)] text-white font-semibold px-5 py-2.5 rounded-md transition-all btn-glow text-sm">
                    <Plus size={16} /> New Post
                </button>
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
                    <p>No posts yet. <button onClick={() => setModalOpen(true)} className="text-[hsl(214_89%_55%)] hover:underline">Write your first post →</button></p>
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
                                    <button onClick={() => { setEditing(post); setModalOpen(true); }} className="p-1.5 text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] hover:bg-[hsl(214_89%_52%/0.08)] rounded-lg transition-all">
                                        <Pencil size={15} />
                                    </button>
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

            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <PostForm
                    initial={editing}
                    onSave={async () => {
                        setModalOpen(false);
                        setLoading(true);
                        await load();
                    }}
                    onClose={() => setModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
