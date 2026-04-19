import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type InfoSection = {
    title: string;
    body: string[];
};

export default function InfoPage({
    eyebrow,
    title,
    intro,
    sections,
}: {
    eyebrow: string;
    title: string;
    intro: string;
    sections: InfoSection[];
}) {
    return (
        <>
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-10">
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[hsl(214_89%_55%)]">
                        {eyebrow}
                    </div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] sm:text-4xl">
                        {title}
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
                        {intro}
                    </p>
                </div>

                <div className="space-y-6">
                    {sections.map((section) => (
                        <section
                            key={section.title}
                            className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-6"
                        >
                            <h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
                                {section.title}
                            </h2>
                            <div className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                                {section.body.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </main>
            <Footer />
        </>
    );
}
