import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Check, ImagePlus, Loader2, Save, Upload } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import { AuthDialog } from "@/components/site/AuthDialog";
import { RichArticleEditor } from "@/components/site/RichArticleEditor";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultEducationArticleRows,
  type EducationArticleCategory,
  type EducationArticleRow,
} from "@/lib/education-content";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/admin_/education/edit/$slug")({
  head: () => ({
    meta: [
      { title: "Edit Education Article | ZacTrades Admin" },
      {
        name: "description",
        content: "Edit an existing ZacTrades education article.",
      },
    ],
  }),
  component: AdminEducationArticleEditPage,
});

const EDUCATION_IMAGE_BUCKET = "education-images";
const MAX_EDUCATION_IMAGE_BYTES = 4 * 1024 * 1024;
const ARTICLE_IMAGE_DRAG_TYPE = "application/x-zactrades-article-image";

const educationCategoryOptions: Array<{ value: EducationArticleCategory; label: string }> = [
  { value: "study", label: "Study" },
  { value: "psychology", label: "Psychology" },
  { value: "risk", label: "Risk Management" },
  { value: "premium", label: "Premium" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

type ArticleFormState = {
  title: string;
  description: string;
  category: EducationArticleCategory;
  access: "Free" | "Members";
  published_date: string;
  cover_subtitle: string;
  cover_image_url: string;
  content: string;
  display_order: string;
  is_published: boolean;
};

const emptyArticleForm: ArticleFormState = {
  title: "",
  description: "",
  category: "study",
  access: "Free",
  published_date: "",
  cover_subtitle: "",
  cover_image_url: "",
  content: "",
  display_order: "20",
  is_published: true,
};

function AdminEducationArticleEditPage() {
  const { slug } = Route.useParams();
  const { user, loading, isConfigured, isAdmin, role } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const [form, setForm] = useState<ArticleFormState>(emptyArticleForm);
  const [articleLoading, setArticleLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [useUploadedImageAsThumbnail, setUseUploadedImageAsThumbnail] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const openAuth = (mode: "signin" | "join") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const updateForm = (patch: Partial<ArticleFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const insertContentBlock = (block: string) => {
    setForm((current) => {
      const trimmed = current.content.trimEnd();
      return {
        ...current,
        content: `${trimmed}${trimmed ? "\n\n" : ""}${block}\n\n`,
      };
    });
  };

  const uploadEducationImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file || !supabase) return;

    setMessage("");
    setErrorMessage("");

    try {
      setUploadingImage(true);
      const imageUrl = await uploadArticleImage(
        file,
        slugify(form.title) || slug || "education-article",
      );
      if (useUploadedImageAsThumbnail) {
        updateForm({ cover_image_url: imageUrl });
      } else {
        insertContentBlock(buildImageHtml(imageUrl));
      }
      setMessage(
        useUploadedImageAsThumbnail
          ? "Image uploaded and set as the article thumbnail."
          : "Image uploaded and inserted into the article content.",
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Could not upload this image.");
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fallbackArticle = defaultEducationArticleRows.find((item) => item.slug === slug);

    const loadArticle = async () => {
      if (!supabase) {
        if (fallbackArticle && mounted) {
          setForm(articleRowToForm(fallbackArticle));
        }
        if (mounted) setArticleLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("education_articles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error(error);
        setErrorMessage(error.message);
      } else if (data) {
        setForm(articleRowToForm(data as EducationArticleRow));
      } else if (fallbackArticle) {
        setForm(articleRowToForm(fallbackArticle));
      } else {
        setErrorMessage("This education article was not found.");
      }

      setArticleLoading(false);
    };

    void loadArticle();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const saveArticle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    const nextSlug = slugify(form.title);

    if (!nextSlug) {
      setErrorMessage("Please add a title before saving.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const payload: EducationArticleRow = {
      slug: nextSlug,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      level: "Core",
      read_time: "Article",
      access: form.access,
      published_date: form.published_date.trim(),
      cover_title: form.title.trim(),
      cover_subtitle: form.cover_subtitle.trim(),
      cover_image_url: form.cover_image_url || null,
      content: form.content.trim(),
      is_published: form.is_published,
      display_order: Number(form.display_order || 20),
    };

    const { error } = await supabase.from("education_articles").update(payload).eq("slug", slug);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage(`${payload.title} was updated.`);
    window.setTimeout(() => {
      window.location.href = "/admin";
    }, 650);
  };

  if (!isConfigured) {
    return (
      <AdminEditShell
        authOpen={authOpen}
        authMode={authMode}
        onAuthOpenChange={setAuthOpen}
        onAuthModeChange={setAuthMode}
      >
        <StatusCard
          title="Supabase is not configured"
          description="Connect Supabase before editing education articles."
        />
      </AdminEditShell>
    );
  }

  if (loading || (user && role === null) || articleLoading) {
    return (
      <AdminEditShell
        authOpen={authOpen}
        authMode={authMode}
        onAuthOpenChange={setAuthOpen}
        onAuthModeChange={setAuthMode}
      >
        <StatusCard
          title="Loading article"
          description="Fetching this education article..."
          loading
        />
      </AdminEditShell>
    );
  }

  if (!user) {
    return (
      <AdminEditShell
        authOpen={authOpen}
        authMode={authMode}
        onAuthOpenChange={setAuthOpen}
        onAuthModeChange={setAuthMode}
      >
        <StatusCard
          title="Admin sign in required"
          description="Sign in with an admin account to edit education articles."
          action={<Button onClick={() => openAuth("signin")}>Sign in</Button>}
        />
      </AdminEditShell>
    );
  }

  if (!isAdmin) {
    return (
      <AdminEditShell
        authOpen={authOpen}
        authMode={authMode}
        onAuthOpenChange={setAuthOpen}
        onAuthModeChange={setAuthMode}
      >
        <StatusCard
          title="Admin access required"
          description="Only admins can edit education articles."
        />
      </AdminEditShell>
    );
  }

  return (
    <AdminEditShell
      authOpen={authOpen}
      authMode={authMode}
      onAuthOpenChange={setAuthOpen}
      onAuthModeChange={setAuthMode}
    >
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="grid-bg absolute inset-0 -z-10 opacity-35" />
        <div className="absolute right-12 top-28 -z-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute left-12 bottom-10 -z-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Button asChild variant="outline" className="glass mb-8 border-border/60">
            <a href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Back to admin
            </a>
          </Button>

          <motion.div {...fadeUp}>
            <Badge variant="outline" className="glass border-primary/35 text-electric">
              Education editor
            </Badge>
            <h1 className="mt-5 max-w-4xl font-display text-4xl font-black tracking-tight sm:text-5xl md:text-7xl">
              Edit Education Article
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-xl">
              Update the article content, add images from your laptop, embed YouTube videos, and
              control whether it is visible to users.
            </p>
          </motion.div>

          <motion.form
            {...fadeUp}
            onSubmit={saveArticle}
            className="glass-strong mt-10 overflow-hidden rounded-3xl p-5 shadow-2xl md:p-8"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <Field
                id="education-title"
                label="Title"
                value={form.title}
                onChange={(value) => updateForm({ title: value })}
                required
              />
              <SelectField
                id="education-category"
                label="Education tab"
                value={form.category}
                onChange={(value) => updateForm({ category: value as EducationArticleCategory })}
                options={educationCategoryOptions}
              />
            </div>

            <div className="mt-5 grid gap-5">
              <TextField
                id="education-description"
                label="Description"
                rows={3}
                value={form.description}
                onChange={(value) => updateForm({ description: value })}
                required
              />

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <RichArticleEditor
                  id="education-content"
                  label="Article content"
                  value={form.content}
                  onChange={(value) => updateForm({ content: value })}
                  required
                />

                <div className="rounded-3xl border border-gold/25 bg-gold/5 p-5 shadow-[0_24px_80px_-64px_hsl(var(--gold)/0.8)]">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/30">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold">Upload article image</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        PNG, JPG, WEBP, or GIF. Max 4 MB.
                      </p>
                    </div>
                  </div>

                  <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm font-bold text-foreground">
                    <input
                      type="checkbox"
                      checked={useUploadedImageAsThumbnail}
                      onChange={(event) => setUseUploadedImageAsThumbnail(event.target.checked)}
                      className="h-5 w-5 rounded border-border/70 accent-primary"
                    />
                    Use uploaded image as thumbnail only
                  </label>

                  <label
                    htmlFor="education-image-upload"
                    className={`mt-4 flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border text-sm font-bold transition-colors ${
                      uploadingImage
                        ? "border-border/60 bg-background/40 text-muted-foreground"
                        : "border-gold/45 bg-gold/10 text-gold hover:bg-gold/15"
                    }`}
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingImage ? "Uploading image..." : "Upload image"}
                  </label>
                  <input
                    id="education-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={uploadingImage}
                    onChange={uploadEducationImage}
                    className="sr-only"
                  />

                  <ThumbnailPicker
                    content={form.content}
                    selectedUrl={form.cover_image_url}
                    onSelect={(url) => updateForm({ cover_image_url: url })}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => updateForm({ is_published: !form.is_published })}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black transition-colors ${
                  form.is_published
                    ? "border-bull/45 bg-bull/10 text-bull"
                    : "border-bear/45 bg-bear/10 text-bear"
                }`}
              >
                <Check className="h-4 w-4" />
                Active: {form.is_published ? "Yes" : "No"}
              </button>

              <Button
                type="submit"
                disabled={saving || uploadingImage}
                className="h-12 min-w-48 rounded-2xl text-sm font-black text-primary-foreground glow-primary hover:opacity-90"
                style={{ background: "var(--gradient-primary)" }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save changes
              </Button>
            </div>

            {(message || errorMessage) && (
              <div
                className={`mt-5 rounded-2xl border p-4 text-sm ${
                  errorMessage
                    ? "border-bear/35 bg-bear/10 text-bear"
                    : "border-bull/35 bg-bull/10 text-bull"
                }`}
              >
                {errorMessage || message}
              </div>
            )}
          </motion.form>
        </div>
      </section>
    </AdminEditShell>
  );
}

function AdminEditShell({
  authOpen,
  authMode,
  onAuthOpenChange,
  onAuthModeChange,
  children,
}: {
  authOpen: boolean;
  authMode: "signin" | "join";
  onAuthOpenChange: (open: boolean) => void;
  onAuthModeChange: (mode: "signin" | "join") => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <AuthDialog
        open={authOpen}
        mode={authMode}
        onOpenChange={onAuthOpenChange}
        onModeChange={onAuthModeChange}
      />
    </div>
  );
}

function StatusCard({
  title,
  description,
  loading = false,
  action,
}: {
  title: string;
  description: string;
  loading?: boolean;
  action?: ReactNode;
}) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 pt-28">
      <div className="glass-strong max-w-xl rounded-3xl p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-electric ring-1 ring-primary/30">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <BookOpen className="h-6 w-6" />
          )}
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        className="mt-2 border-border/60 bg-background/45"
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-md border border-border/60 bg-background/45 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  id,
  label,
  rows,
  placeholder,
  value,
  onChange,
  required = false,
}: {
  id: string;
  label: string;
  rows: number;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 border-border/60 bg-background/45"
      />
    </div>
  );
}

function toDateInputValue(value: string) {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function articleRowToForm(row: EducationArticleRow): ArticleFormState {
  return {
    title: row.title,
    description: row.description,
    category: row.category,
    access: row.access,
    published_date: toDateInputValue(row.published_date),
    cover_subtitle: row.cover_subtitle,
    cover_image_url: row.cover_image_url ?? getFirstArticleImageUrl(row.content) ?? "",
    content: row.content,
    display_order: String(row.display_order),
    is_published: row.is_published,
  };
}

async function uploadArticleImage(file: File, slug: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  if (file.size > MAX_EDUCATION_IMAGE_BYTES) {
    throw new Error("Please upload an image smaller than 4 MB.");
  }

  if (!isAcceptedEducationImage(file)) {
    throw new Error("Please upload a PNG, JPG, WEBP, or GIF image.");
  }

  const safeFileName = slugify(file.name.replace(/\.[^.]+$/i, "")) || "article-image";
  const extension = getImageFileExtension(file);
  const storagePath = `${slug}/${crypto.randomUUID()}-${safeFileName}.${extension}`;
  const { error } = await supabase.storage.from(EDUCATION_IMAGE_BUCKET).upload(storagePath, file, {
    cacheControl: "86400",
    contentType: getImageContentType(file),
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(EDUCATION_IMAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function isAcceptedEducationImage(file: File) {
  const acceptedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  const acceptedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
  const lowerName = file.name.toLowerCase();
  const hasAcceptedExtension = acceptedExtensions.some((extension) =>
    lowerName.endsWith(extension),
  );

  return (!file.type || acceptedTypes.includes(file.type)) && hasAcceptedExtension;
}

function getImageFileExtension(file: File) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || file.type === "image/jpeg")
    return "jpg";
  if (lowerName.endsWith(".webp") || file.type === "image/webp") return "webp";
  if (lowerName.endsWith(".gif") || file.type === "image/gif") return "gif";

  return "png";
}

function getImageContentType(file: File) {
  const acceptedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (acceptedTypes.includes(file.type)) return file.type;

  const extension = getImageFileExtension(file);
  const contentTypes: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };

  return contentTypes[extension] ?? "image/png";
}

function ThumbnailPicker({
  content,
  selectedUrl,
  onSelect,
}: {
  content: string;
  selectedUrl: string;
  onSelect: (url: string) => void;
}) {
  const images = getArticleImages(content);

  if (!selectedUrl && !images.length) {
    return null;
  }

  return (
    <div className="mt-5 rounded-2xl border border-border/45 bg-background/30 p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
        Article thumbnail
      </p>
      {selectedUrl ? (
        <div
          draggable
          title="Drag image into article content"
          onDragStart={(event) => setArticleImageDragData(event.dataTransfer, selectedUrl)}
          className="mt-3 cursor-grab overflow-hidden rounded-xl border border-primary/25 bg-background/40 active:cursor-grabbing"
        >
          <img
            src={selectedUrl}
            alt="Article thumbnail preview"
            className="aspect-video w-full object-cover"
            draggable={false}
          />
          <p className="px-3 py-2 text-xs font-bold text-electric">Current thumbnail</p>
        </div>
      ) : null}
      {images.length ? (
        <div className="mt-4 grid gap-3">
          {images.map((image, index) => {
            const isSelected = image.url === selectedUrl;
            return (
              <button
                key={image.url + index}
                type="button"
                onClick={() => onSelect(image.url)}
                draggable
                title="Drag image into article content"
                onDragStart={(event) => setArticleImageDragData(event.dataTransfer, image.url)}
                className={`flex items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
                  isSelected
                    ? "cursor-grab border-gold/50 bg-gold/10 text-gold active:cursor-grabbing"
                    : "cursor-grab border-border/45 bg-background/35 text-muted-foreground hover:border-primary/35 hover:text-foreground active:cursor-grabbing"
                }`}
              >
                <img
                  src={image.url}
                  alt={image.caption || `Article image ${index + 1}`}
                  className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  draggable={false}
                />
                <span className="min-w-0 flex-1 text-xs font-bold">
                  {isSelected ? "Selected thumbnail" : "Use this image as thumbnail"}
                </span>
                {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function buildImageHtml(url: string) {
  const safeUrl = escapeHtmlAttribute(url);
  return '<img src="' + safeUrl + '" alt="Education article image" />';
}

function setArticleImageDragData(dataTransfer: DataTransfer, url: string) {
  dataTransfer.effectAllowed = "copy";
  dataTransfer.setData(ARTICLE_IMAGE_DRAG_TYPE, url);
  dataTransfer.setData("text/uri-list", url);
  dataTransfer.setData("text/plain", url);
  dataTransfer.setData("text/html", buildImageHtml(url));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeHtmlAttribute(value: string) {
  return escapeHtml(value);
}
function getArticleImages(content: string) {
  const images = Array.from(
    content.matchAll(/\[image:([^|\]]+)(?:\|([^\]]+))?\]|<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi),
  ).map((match) => {
    if (match[1]) {
      return {
        url: match[1].trim(),
        caption: match[2]?.trim() ?? "",
      };
    }

    const imageHtml = match[0] ?? "";
    const altMatch = imageHtml.match(/\salt=["']([^"']*)["']/i);

    return {
      url: decodeHtml(match[3]?.trim() ?? ""),
      caption: decodeHtml(altMatch?.[1]?.trim() ?? ""),
    };
  });

  const seen = new Set<string>();
  return images.filter((image) => {
    if (!image.url || seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

function getFirstArticleImageUrl(content: string) {
  return getArticleImages(content)[0]?.url ?? null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
