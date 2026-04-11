"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Loader2, Search } from "lucide-react";

interface Category { id: string; name: string; icon?: string | null; _count?: { products: number }; }

const EMOJI_OPTIONS = ["📱", "👗", "🏠", "💄", "🍳", "🎮", "📚", "🧴", "🏋️", "🚗", "🎵", "✈️", "🌿", "⌚", "💻", "🎒"];

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("📦");
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
                body: JSON.stringify({ name, icon }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            setName(""); setIcon("📦");
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
        <div className="animate-fade-in-up lg:pt-0 pt-16">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Categories</h1>
                <p className="text-gray-400 text-sm mt-1">{categories.length} categories</p>
            </div>

            {/* Add Form */}
            <div className="glass rounded-2xl p-6 mb-8">
                <h2 className="font-semibold text-gray-200 mb-4">Add New Category</h2>
                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Pick an Icon</label>
                        <div className="flex flex-wrap gap-2">
                            {EMOJI_OPTIONS.map((e) => (
                                <button key={e} type="button" onClick={() => setIcon(e)}
                                    className={`text-xl w-10 h-10 rounded-xl transition-all ${icon === e ? "bg-orange-500/20 ring-2 ring-orange-500 scale-110" : "bg-gray-800 hover:bg-gray-700"}`}>
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 text-2xl">{icon}</div>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name..."
                            required className="input-base flex-1" />
                        <button type="submit" disabled={adding}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm flex-shrink-0">
                            {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                            Add
                        </button>
                    </div>
                </form>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories..."
                    className="input-base pl-10 max-w-xs" />
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <Tag size={36} className="mx-auto mb-3 opacity-30" />
                    <p>No categories yet. Add one above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map((cat) => (
                        <div key={cat.id} className="glass rounded-2xl p-4 flex flex-col items-center text-center gap-2 group relative hover:border-orange-500/30 transition-all">
                            <div className="text-4xl">{cat.icon || "📦"}</div>
                            <div className="font-semibold text-gray-200 text-sm">{cat.name}</div>
                            <div className="text-xs text-gray-500">{cat._count?.products || 0} products</div>
                            <button onClick={() => handleDelete(cat.id)} disabled={deleting === cat.id}
                                className="absolute top-2.5 right-2.5 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                {deleting === cat.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
