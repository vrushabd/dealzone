type BasicCategory = {
    id: string;
    name: string;
    slug: string;
};

type CategoryRule = {
    preferred: string[];
    keywords: string[];
    fallback?: string[];
};

const CATEGORY_RULES: CategoryRule[] = [
    {
        preferred: ["smart-phone", "smartphone", "phone", "mobile"],
        fallback: ["electronics"],
        keywords: [
            "mobile",
            "smartphone",
            "smart phone",
            "phone",
            "5g",
            "oppo",
            "iphone",
            "samsung",
            "redmi",
            "realme",
            "vivo",
            "oneplus",
            "pixel",
            "motorola",
            "nothing phone",
        ],
    },
    {
        preferred: ["electronics"],
        keywords: [
            "laptop",
            "macbook",
            "notebook",
            "computer",
            "monitor",
            "tablet",
            "headphone",
            "earbuds",
            "speaker",
            "soundbar",
            "television",
            "smart tv",
            "camera",
            "router",
            "ssd",
            "hard drive",
            "keyboard",
            "mouse",
            "printer",
        ],
    },
    {
        preferred: ["fashion"],
        keywords: [
            "shoe",
            "sneaker",
            "shirt",
            "t-shirt",
            "jeans",
            "trouser",
            "cargo",
            "kurta",
            "dress",
            "saree",
            "hoodie",
            "jacket",
            "watch",
            "bag",
            "wallet",
        ],
    },
    {
        preferred: ["home-kitchen", "home", "kitchen"],
        keywords: [
            "kitchen",
            "air fryer",
            "mixer",
            "grinder",
            "cooker",
            "pan",
            "pot",
            "utensil",
            "vacuum",
            "cleaner",
            "mop",
            "furniture",
            "mattress",
            "bedsheet",
            "sofa",
            "instant pot",
        ],
    },
    {
        preferred: ["beauty"],
        keywords: [
            "beauty",
            "makeup",
            "serum",
            "cream",
            "shampoo",
            "conditioner",
            "skincare",
            "lipstick",
            "perfume",
            "deodorant",
        ],
    },
    {
        preferred: ["gaming"],
        keywords: [
            "gaming",
            "xbox",
            "playstation",
            "ps5",
            "controller",
            "gaming mouse",
            "gaming keyboard",
            "gaming headset",
        ],
    },
    {
        preferred: ["books"],
        keywords: [
            "book",
            "novel",
            "paperback",
            "hardcover",
            "author",
            "edition",
            "james clear",
        ],
    },
];

const EXCLUDED_CATEGORY_ALIASES = ["compare", "uncategorized"];

function normalize(value: string | null | undefined) {
    return value?.trim().toLowerCase().replace(/\s+/g, " ") || "";
}

function categoryScore(category: BasicCategory, content: string) {
    const slug = normalize(category.slug);
    const name = normalize(category.name);
    let score = 0;

    if (!content) return score;
    if (EXCLUDED_CATEGORY_ALIASES.some((alias) => slug.includes(alias) || name.includes(alias))) {
        return 0;
    }
    if (content.includes(name)) score += 8;
    if (slug && content.includes(slug.replace(/-/g, " "))) score += 8;
    if (slug && content.includes(slug)) score += 8;

    return score;
}

function findCategoryByAliases(categories: BasicCategory[], aliases: string[]) {
    const normalizedAliases = aliases.map(normalize);
    return categories.find((category) => {
        const slug = normalize(category.slug);
        const name = normalize(category.name);
        if (EXCLUDED_CATEGORY_ALIASES.some((alias) => slug.includes(alias) || name.includes(alias))) {
            return false;
        }
        return normalizedAliases.some((alias) => slug.includes(alias) || name.includes(alias));
    });
}

export function inferCategoryIdFromText(
    categories: BasicCategory[],
    input: {
        scrapedCategory?: string | null;
        title?: string | null;
        description?: string | null;
    }
) {
    const texts = [input.scrapedCategory, input.title, input.description]
        .map(normalize)
        .filter(Boolean);
    const combined = texts.join(" ");

    if (!combined) return null;

    let bestCategory: BasicCategory | null = null;
    let bestScore = 0;

    for (const category of categories) {
        const score = categoryScore(category, combined);
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }

    if (bestCategory && bestScore >= 8) {
        return bestCategory.id;
    }

    for (const rule of CATEGORY_RULES) {
        if (!rule.keywords.some((keyword) => combined.includes(keyword))) continue;

        const preferredMatch = findCategoryByAliases(categories, rule.preferred);
        if (preferredMatch) return preferredMatch.id;

        if (rule.fallback) {
            const fallbackMatch = findCategoryByAliases(categories, rule.fallback);
            if (fallbackMatch) return fallbackMatch.id;
        }
    }

    return null;
}
