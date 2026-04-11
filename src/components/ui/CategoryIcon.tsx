import {
    Smartphone, Tv, ShoppingBag, Sparkles,
    Gamepad2, BookOpen, Home, Shirt, Watch,
    Headphones, Camera, Dumbbell, Car, Baby,
    UtensilsCrossed, Flower2, Laptop, Tag,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
    electronics:   Smartphone,
    fashion:       Shirt,
    "home-kitchen": Home,
    beauty:        Sparkles,
    gaming:        Gamepad2,
    books:         BookOpen,
    tv:            Tv,
    audio:         Headphones,
    cameras:       Camera,
    sports:        Dumbbell,
    automotive:    Car,
    baby:          Baby,
    food:          UtensilsCrossed,
    flowers:       Flower2,
    laptops:       Laptop,
    watches:       Watch,
    bags:          ShoppingBag,
};

const colorMap: Record<string, string> = {
    electronics:   "text-blue-400   bg-blue-500/10   border-blue-500/20",
    fashion:       "text-pink-400   bg-pink-500/10   border-pink-500/20",
    "home-kitchen": "text-green-400  bg-green-500/10  border-green-500/20",
    beauty:        "text-purple-400 bg-purple-500/10 border-purple-500/20",
    gaming:        "text-red-400    bg-red-500/10    border-red-500/20",
    books:         "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    tv:            "text-cyan-400   bg-cyan-500/10   border-cyan-500/20",
    audio:         "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    cameras:       "text-[hsl(214_89%_55%)] bg-[hsl(214_89%_52%/0.08)] border-[hsl(214_89%_52%/0.20)]",
    sports:        "text-lime-400   bg-lime-500/10   border-lime-500/20",
    watches:       "text-amber-400  bg-amber-500/10  border-amber-500/20",
};

interface Props {
    slug: string;
    name?: string;
    /** "bar" = small chip in navbar, "card" = sidebar card, "page" = category page header */
    variant?: "bar" | "card" | "page";
}

export default function CategoryIcon({ slug, name, variant = "card" }: Props) {
    const Icon = iconMap[slug] ?? Tag;
    const color = colorMap[slug] ?? "text-[hsl(214_89%_55%)] bg-[hsl(214_89%_52%/0.08)] border-[hsl(214_89%_52%/0.20)]";

    if (variant === "bar") {
        return <Icon size={13} className={color.split(" ")[0]} />;
    }

    if (variant === "page") {
        return (
            <div className={`w-14 h-14 rounded-md border flex items-center justify-center ${color}`}>
                <Icon size={28} />
            </div>
        );
    }

    // "card" variant — for sidebar grid
    return (
        <div className={`w-10 h-10 rounded-md border flex items-center justify-center mx-auto mb-2 ${color}`}>
            <Icon size={20} />
        </div>
    );
}
