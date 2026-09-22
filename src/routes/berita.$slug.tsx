import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, Share2 } from "lucide-react";
import { toast } from "sonner";

import { getArticleBySlug, newsArticles } from "@/lib/news-data";

export const Route = createFileRoute("/berita/$slug")({
  loader: ({ params }) => {
    const article = getArticleBySlug(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Berita tidak ditemukan — Gotrade" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { article } = loaderData;
    return {
      meta: [
        { title: `${article.title} — Gotrade` },
        { name: "description", content: article.excerpt },
        { property: "og:title", content: `${article.title} — Gotrade` },
        { property: "og:description", content: article.excerpt },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: BeritaDetailPage,
});

function BeritaDetailPage() {
  const { article } = Route.useLoaderData();
  const related = newsArticles.filter((a) => a.slug !== article.slug).slice(0, 3);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: article.excerpt, url });
        return;
      } catch {
        /* user batal membagikan */
      }
    }
    try {
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success("Tautan berita disalin ke clipboard.");
      }
    } catch {
      /* clipboard tidak tersedia */
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-muted/40">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-3">
        <Link
          to="/berita"
          aria-label="Kembali ke daftar berita"
          className="rounded-full p-1.5 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
        <span className="text-sm font-semibold text-foreground">Detail Berita</span>
        <button
          type="button"
          onClick={share}
          aria-label="Bagikan berita"
          className="rounded-full p-1.5 hover:bg-muted"
        >
          <Share2 className="h-5 w-5 text-foreground" />
        </button>
      </header>

      <main className="flex flex-1 flex-col px-4 py-4">
        <article className="rounded-xl border bg-card p-4 shadow-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
            ⚡ {article.tag}
          </span>
          <h1 className="mt-2.5 text-xl font-bold leading-snug text-foreground">{article.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {article.date} · {article.readMinutes} menit baca
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {article.tickers.map((t) => (
              <span
                key={t.label}
                className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {t.label} <span className={t.up ? "text-primary" : "text-red-500"}>{t.change}</span>
              </span>
            ))}
          </div>

          <img
            src={article.image}
            alt={article.title}
            className="mt-4 h-44 w-full rounded-lg object-cover"
          />

          <div className="mt-4 flex flex-col gap-3.5">
            {article.body.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          <p className="mt-5 rounded-lg bg-muted p-3 text-[11px] leading-relaxed text-muted-foreground">
            Konten ini hanya untuk tujuan informasi dan bukan merupakan rekomendasi investasi.
            Trading mengandung risiko tinggi — pastikan Anda memahami risikonya sebelum
            bertransaksi.
          </p>
        </article>

        {related.length > 0 && (
          <section className="mt-5">
            <h2 className="text-base font-semibold text-foreground">Berita Lainnya</h2>
            <div className="mt-3 flex flex-col gap-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to="/berita/$slug"
                  params={{ slug: item.slug }}
                  className="flex gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
                      ⚡ {item.tag}
                    </span>
                    <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{item.time}</p>
                  </div>
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="h-16 w-20 shrink-0 rounded-lg object-cover"
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
