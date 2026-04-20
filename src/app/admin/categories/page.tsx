"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Loader2, Search } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface Category { id: string; name: string; slug: string; icon?: string | null; _count?: { products: number }; }

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const load = async () => {
        setLoading(true);
        const data = await fetch("/api/categories").then(r => r.json());
        setCategories(data); setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setAdding(true); setError("");
        try {
            const res = await fetch("/api/categories", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            setName("");
            load();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error adding category");
        } finally { setAdding(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this category? Products won't be deleted.")) return;
        setDeleting(id);
        await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
        setDeleting(null); load();
    };

    const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Categories</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">{categories.length} categories</p>
            </div>

            {/* Add Form */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-6 mb-8 shadow-sm">
                <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Tag size={18} className="text-[hsl(214_89%_52%)]" />
                    Add New Category
                </h2>
                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-4 py-3 text-sm mb-4">{error}</div>}
                <form onSubmit={handleAdd} className="flex gap-3 max-w-xl">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Smart Watches..."
                        required className="input-base flex-1" />
                    <button type="submit" disabled={adding}
                        className="inline-flex items-center gap-2 bg-[hsl(214_89%_52%)] hover:bg-[hsl(214_89%_45%)] text-white font-medium px-5 py-2.5 rounded-md transition-all disabled:opacity-50 text-sm flex-shrink-0">
                        {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                        Save
                    </button>
                </form>
                <p className="text-xs text-[var(--text-muted)] mt-3">An icon will be automatically assigned based on the category name.</p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 max-w-sm mb-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_3px_var(--brand-glow)] transition-all duration-200">
                <Search size={15} className="text-[var(--text-muted)] flex-shrink-0" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="flex-1 py-2.5 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] outline-none"
                />
            </div>

            {loading ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                     {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-32 rounded-md" />)}
                 </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-muted)] bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-md">
                    <Tag size={36} className="mx-auto mb-3 opacity-30" />
                    <p>No categories found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filtered.map((cat) => (
                        <div key={cat.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-5 flex flex-col items-center text-center gap-2 group relative hover:border-[hsl(214_89%_52%/0.40)] transition-all shadow-sm">
                            <CategoryIcon slug={cat.slug} variant="page" />
                            <div className="font-semibold text-[var(--text-primary)] text-sm mt-1">{cat.name}</div>
                            <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full">{cat._count?.products || 0} products</div>
                            <button onClick={() => handleDelete(cat.id)} disabled={deleting === cat.id}
                                className="absolute top-2.5 right-2.5 p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                {deleting === cat.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
