import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { newsArticles } from "@/lib/news-data";

export const Route = createFileRoute("/berita/")({
  head: () => ({
    meta: [
      { title: "Berita — Gotrade" },
      {
        name: "description",
        content:
          "Berita pasar terbaru, analisis teknikal, dan artikel spesial untuk membantu Anda mengambil keputusan trading di Gotrade.",
      },
      { property: "og:title", content: "Berita — Gotrade" },
      {
        property: "og:description",
        content: "Berita pasar terbaru dan analisis teknikal di Gotrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BeritaPage,
});

const categories = ["Semua", "Special Article", "Technical Overview", "Market News"] as const;

function BeritaPage() {
  const [category, setCategory] = useState<(typeof categories)[number]>("Semua");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    return newsArticles.filter((a) => {
      const matchCategory = category === "Semua" || a.category === category;
      const matchQuery = a.title.toLowerCase().includes(query.trim().toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [category, query]);

  const [featured, ...rest] = list;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-muted/40">
      <header className="sticky top-0 z-10 bg-background px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Berita</h1>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari berita…"
              className="w-44 rounded-full border bg-muted/50 py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-4 py-4">
        {list.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            Tidak ada berita yang cocok dengan pencarian Anda.
          </p>
        ) : (
          <>
            {featured && (
              <Link
                to="/berita/$slug"
                params={{ slug: featured.slug }}
                className="overflow-hidden rounded-xl border bg-card shadow-sm transition-colors hover:bg-muted/40"
              >
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="h-40 w-full object-cover"
                />
                <div className="p-3.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
                    ⚡ {featured.tag}
                  </span>
                  <h2 className="mt-2 text-base font-bold leading-snug text-foreground">
                    {featured.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {featured.excerpt}
                  </p>
                  <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {featured.time} · {featured.readMinutes} menit baca
                  </p>
                </div>
              </Link>
            )}

            {rest.map((item) => (
              <Link
                key={item.slug}
                to="/berita/$slug"
                params={{ slug: item.slug }}
                className="rounded-xl border bg-card p-3 shadow-sm transition-colors hover:bg-muted/40"
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
                  ⚡ {item.tag}
                </span>
                <div className="mt-2 flex gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold leading-snug text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {item.tickers.map((t) => (
                        <span key={t.label}>
                          {t.label}{" "}
                          <span className={t.up ? "text-primary" : "text-red-500"}>{t.change}</span>
                        </span>
                      ))}
                    </p>
                  </div>
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="h-16 w-20 shrink-0 rounded-lg object-cover"
                  />
                </div>
                <p className="mt-2 text-right text-[11px] text-muted-foreground">{item.time}</p>
              </Link>
            ))}
          </>
        )}
      </main>

      <BottomNav active="Lainnya" />
    </div>
  );
}
