import { ImagePlus, Newspaper, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { secureFetch } from "@/lib/api-client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { newsArticles } from "@/lib/news-data";

import { AdminLayout } from "./AdminLayout";

type AdminArticle = {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  body: string[];
  date: string;
  readMinutes: number;
  status: "Terbit" | "Draf";
  imageUrl: string | null;
};

const categories = ["Special Article", "Technical Overview", "Market News"];

const initialArticles: AdminArticle[] = newsArticles.map((article, index) => ({
  id: index + 1,
  title: article.title,
  category: article.category,
  excerpt: article.excerpt,
  body: article.body,
  date: article.date,
  readMinutes: article.readMinutes,
  status: index % 4 === 3 ? "Draf" : "Terbit",
  imageUrl: article.image,
}));

type FormState = {
  title: string;
  category: string;
  excerpt: string;
  body: string;
  status: "Terbit" | "Draf";
  imageUrl: string | null;
};

const emptyForm: FormState = {
  title: "",
  category: "Market News",
  excerpt: "",
  body: "",
  status: "Draf",
  imageUrl: null,
};

export function NewsAdminPage() {
  const [articles, setArticles] = useState<AdminArticle[]>(initialArticles);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchNews = async () => {
    try {
      const res = await secureFetch("/api/news");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.news) && data.news.length > 0) {
        type DbNewsItem = {
          id: number;
          title: string;
          category: string;
          excerpt: string;
          body: string;
          date: string;
          read_minutes: number;
          status: "Terbit" | "Draf";
          image_url: string;
        };
        const mapped: AdminArticle[] = (data.news as DbNewsItem[]).map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          excerpt: item.excerpt,
          body: typeof item.body === "string" ? item.body.split("\n\n") : [item.excerpt],
          date: item.date || "20 September 2026",
          readMinutes: item.read_minutes || 3,
          status: item.status === "Draf" ? "Draf" : "Terbit",
          imageUrl: item.image_url || null,
        }));
        setArticles(mapped);
      }
    } catch {
      // keep initial
    }
  };

  useEffect(() => {
    void fetchNews();
  }, []);

  const filtered = useMemo(
    () =>
      articles.filter((article) => {
        const matchesQuery = article.title.toLowerCase().includes(query.toLowerCase());
        return matchesQuery && (category === "Semua" || article.category === category);
      }),
    [articles, query, category],
  );

  const published = articles.filter((article) => article.status === "Terbit").length;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (article: AdminArticle) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      body: article.body.join("\n\n"),
      status: article.status,
      imageUrl: article.imageUrl,
    });
    setDialogOpen(true);
  };

  const handleImagePick = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, imageUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title || !form.excerpt) {
      toast.error("Judul dan Ringkasan Berita wajib diisi");
      return;
    }

    const body = form.body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    const bodyText = body.join("\n\n");

    try {
      if (editingId === null) {
        const newArt: AdminArticle = {
          id: Math.max(0, ...articles.map((article) => article.id)) + 1,
          title: form.title,
          category: form.category,
          excerpt: form.excerpt,
          body,
          date: "20 September 2026",
          readMinutes: Math.max(1, Math.ceil(body.join(" ").split(" ").length / 200)),
          status: form.status,
          imageUrl: form.imageUrl,
        };
        setArticles((current) => [newArt, ...current]);

        secureFetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            category: form.category,
            excerpt: form.excerpt,
            body: bodyText,
            status: form.status,
            imageUrl: form.imageUrl,
          }),
        }).catch(() => {});

        toast.success("Berita baru berhasil ditambahkan");
      } else {
        setArticles((current) =>
          current.map((article) =>
            article.id === editingId
              ? {
                  ...article,
                  title: form.title,
                  category: form.category,
                  excerpt: form.excerpt,
                  body,
                  status: form.status,
                  imageUrl: form.imageUrl,
                }
              : article,
          ),
        );

        secureFetch("/api/news", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            title: form.title,
            category: form.category,
            excerpt: form.excerpt,
            body: bodyText,
            status: form.status,
            imageUrl: form.imageUrl,
          }),
        }).catch(() => {});

        toast.success("Berita berhasil diperbarui");
      }
    } catch {
      toast.error("Gagal menyimpan berita");
    } finally {
      setDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const targetId = deletingId;
    setArticles((current) => current.filter((article) => article.id !== targetId));

    try {
      await secureFetch(`/api/news?id=${targetId}`, { method: "DELETE" });
      toast.success("Berita berhasil dihapus");
    } catch {
      toast.success("Berita dihapus dari tampilan");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Berita" subtitle="Kelola artikel berita dan edukasi untuk pengguna">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Total Berita</p>
            <p className="mt-2 text-xl font-bold tabular-nums text-card-foreground">
              {articles.length}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Terbit</p>
            <p className="mt-2 text-xl font-bold tabular-nums text-primary">{published}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Draf</p>
            <p className="mt-2 text-xl font-bold tabular-nums text-card-foreground">
              {articles.length - published}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-card-foreground">Daftar Berita</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tambah, ubah, atau hapus artikel yang tampil di aplikasi.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari judul berita..."
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua kategori</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={openCreate}>
                <Plus />
                Tambah Berita
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="min-w-64 pl-4">Judul</TableHead>
                <TableHead className="min-w-40">Kategori</TableHead>
                <TableHead className="min-w-32">Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      {article.imageUrl ? (
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="size-10 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Newspaper className="size-4" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{article.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{article.excerpt}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{article.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{article.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        article.status === "Terbit"
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-chart-4/30 bg-chart-4/15 text-foreground"
                      }
                    >
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Ubah ${article.title}`}
                        title="Ubah"
                        onClick={() => openEdit(article)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Hapus ${article.title}`}
                        title="Hapus"
                        onClick={() => setDeletingId(article.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Tidak ada berita yang sesuai.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            Menampilkan {filtered.length} dari {articles.length} berita
          </div>
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId === null ? "Tambah Berita" : "Ubah Berita"}</DialogTitle>
            <DialogDescription>
              Isi detail berita di bawah ini. Pisahkan paragraf dengan baris kosong.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Gambar Sampul</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImagePick(event.target.files?.[0])}
              />
              {form.imageUrl ? (
                <div className="relative overflow-hidden rounded-lg border">
                  <img
                    src={form.imageUrl}
                    alt="Pratinjau sampul"
                    className="h-44 w-full object-cover"
                  />
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Ganti
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      aria-label="Hapus gambar"
                      onClick={() => setForm((current) => ({ ...current, imageUrl: null }))}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:bg-muted/50"
                >
                  <ImagePlus className="size-6" />
                  <span className="text-sm font-medium">Unggah gambar dari perangkat</span>
                  <span className="text-xs">PNG, JPG, atau WEBP</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-title">Judul</Label>
              <Input
                id="news-title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Judul berita..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, status: value as "Terbit" | "Draf" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Terbit">Terbit</SelectItem>
                    <SelectItem value="Draf">Draf</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-excerpt">Ringkasan</Label>
              <Textarea
                id="news-excerpt"
                value={form.excerpt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, excerpt: event.target.value }))
                }
                placeholder="Ringkasan singkat yang tampil di kartu berita..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-body">Isi Berita (Detail)</Label>
              <Textarea
                id="news-body"
                value={form.body}
                onChange={(event) =>
                  setForm((current) => ({ ...current, body: event.target.value }))
                }
                placeholder={
                  "Tulis isi berita di sini...\n\nPisahkan setiap paragraf dengan baris kosong."
                }
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                {form.body.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).length} paragraf
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>
              {editingId === null ? "Simpan Berita" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus berita ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Berita yang dihapus tidak dapat dikembalikan dan akan hilang dari aplikasi pengguna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
