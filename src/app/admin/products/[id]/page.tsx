import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    // Fetch product and categories concurrently
    const [product, categories] = await Promise.all([
        prisma.product.findUnique({
            where: { id },
            include: { category: true }
        }),
        prisma.category.findMany({ 
            orderBy: { name: 'asc' },
            select: { id: true, name: true, slug: true } 
        })
    ]);

    if (!product) {
        notFound();
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 animate-fade-in-up">
            <Link 
                href="/admin/products" 
                className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] text-sm mb-6 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Products
            </Link>
            
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Edit Product</h1>
                <p className="text-[var(--text-secondary)] mt-1 text-sm">
                    Update the details for <strong>{product.title}</strong>
                </p>
            </div>

            <ProductForm initial={product} categories={categories} />
        </div>
    );
}
