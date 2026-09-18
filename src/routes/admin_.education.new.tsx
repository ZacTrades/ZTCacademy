import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Check, ImagePlus, Loader2, Save, Upload } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

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

export const Route = createFileRoute("/admin_/education/new")({
  head: () => ({
    meta: [
      { title: "Add Education Article | ZacTrades Admin" },
      {
        name: "description",
        content: "Create a new ZacTrades education article.",
      },
    ],
  }),
  component: AdminEducationArticleCreatePage,
});

const EDUCATION_IMAGE_BUCKET = "education-images";
const MAX_EDUCATION_IMAGE_BYTES = 4 * 1024 * 1024;

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

function AdminEducationArticleCreatePage() {
  const { user, loading, isConfigured, isAdmin, role } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "join">("signin");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [useUploadedImageAsThumbnail, setUseUploadedImageAsThumbnail] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const openAuth = (mode: "signin" | "join") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const insertContentBlock = (block: string) => {
    setContent((current) => {
      const trimmed = current.trimEnd();
      return `${trimmed}${trimmed ? "\n\n" : ""}${block}\n\n`;
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
      const imageUrl = await uploadArticleImage(file, slugify(title) || "education-article");
      if (useUploadedImageAsThumbnail) {
        setCoverImageUrl(imageUrl);
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

  const createArticle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    const formData = new FormData(event.currentTarget);
    const formTitle = title.trim();
    const nextSlug = slugify(formTitle);
    const nextOrder = defaultEducationArticleRows.length + 1;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const payload: EducationArticleRow = {
      slug: nextSlug,
      title: formTitle,
      description: String(formData.get("description") ?? "").trim(),
      category: String(formData.get("category") ?? "study") as EducationArticleCategory,
      level: "Core",
      read_time: "Article",
      access: String(formData.get("access") ?? "Free") as "Free" | "Members",
      published_date: new Date().toISOString().slice(0, 10),
      cover_title: formTitle,
      cover_subtitle: String(formData.get("cover_subtitle") ?? "").trim(),
      cover_image_url: coverImageUrl || null,
      content: content.trim(),
      is_published: isPublished,
      display_order: nextOrder,
    };

    const { error } = await supabase.from("education_articles").insert(payload);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage(`${payload.title} was created.`);
    window.setTimeout(() => {
      window.location.href = "/admin";
    }, 650);
  };

  if (!isConfigured) {
    return (
      <AdminCreateShell
        authOpen={authOpen}
        authMode={authMode}
        onAuthOpenChange={setAuthOpen}
        onAuthModeChange={setAuthMode}
      >
        <StatusCard
          title="Supabase is not configured"
          description="Connect Supabase before adding education articles."
        />
      </AdminCreateShell>
    );
  }

  if (loading || (user && role === null)) {
    return (
      <AdminCreateShell
        authOpen={authOpen}
        authMode={authMode}
        onAuthOpenChange={setAuthOpen}
        onAuthModeChange={setAuthMode}
      >
        <StatusCard
          title="Checking access"
          description="Loading your admin permissions..."
          loading
        />
      </AdminCreateShell>
    );
  }

  if (!user) {
    return (
      <AdminCreateShell
        authOpen={authOpen}
        authMode={authMode}
        onAuthOpenChange={setAuthOpen}
        onAuthModeChange={setAuthMode}
      >
        <StatusCard
          title="Admin sign in required"
          description="Sign in with an admin account to add education articles."
          action={<Button onClick={() => openAuth("signin")}>Sign in</Button>}
        />
      </AdminCreateShell>
    );
  }

  if (!isAdmin) {
    return (
      <AdminCreateShell
        authOpen={authOpen}
        authMode={authMode}
        onAuthOpenChange={setAuthOpen}
        onAuthModeChange={setAuthMode}
      >
        <StatusCard
          title="Admin access required"
          description="Only admins can create education articles."
        />
      </AdminCreateShell>
    );
  }

  return (
    <AdminCreateShell
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
              Add Education Article
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-xl">
              Write a new article for Study, Psychology, Risk Management, or Premium. After saving,
              it returns to the admin list where you can activate, hide, preview, or delete it.
            </p>
          </motion.div>

          <motion.form
            {...fadeUp}
            onSubmit={createArticle}
            className="glass-strong mt-10 overflow-hidden rounded-3xl p-5 shadow-2xl md:p-8"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <Field
                id="education-title"
                label="Title"
                value={title}
                onChange={handleTitleChange}
                required
              />
              <SelectField
                id="education-category"
                label="Education tab"
                name="category"
                options={educationCategoryOptions}
              />
            </div>

            <div className="mt-5 grid gap-5">
              <TextField
                id="education-description"
                label="Description"
                name="description"
                rows={3}
                required
              />

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <RichArticleEditor
                  id="education-content"
                  label="Article content"
                  value={content}
                  onChange={setContent}
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
                    content={content}
                    selectedUrl={coverImageUrl}
                    onSelect={setCoverImageUrl}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setIsPublished((current) => !current)}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black transition-colors ${
                  isPublished
                    ? "border-bull/45 bg-bull/10 text-bull"
                    : "border-bear/45 bg-bear/10 text-bear"
                }`}
              >
                <Check className="h-4 w-4" />
                Active: {isPublished ? "Yes" : "No"}
              </button>

              <Button
                type="submit"
                disabled={saving}
                className="h-12 min-w-48 rounded-2xl text-sm font-black text-primary-foreground glow-primary hover:opacity-90"
                style={{ background: "var(--gradient-primary)" }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save article
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
    </AdminCreateShell>
  );
}

function AdminCreateShell({
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
    <div className="min-h-screen bg-background text-foreground">
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
  name,
  defaultValue,
  placeholder,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name ?? id}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
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
  name,
  options,
}: {
  id: string;
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
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
  name,
  rows,
  placeholder,
  value,
  onChange,
  required = false,
}: {
  id: string;
  label: string;
  name: string;
  rows: number;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        className="mt-2 border-border/60 bg-background/45"
      />
    </div>
  );
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
        <div className="mt-3 overflow-hidden rounded-xl border border-primary/25 bg-background/40">
          <img
            src={selectedUrl}
            alt="Article thumbnail preview"
            className="aspect-video w-full object-cover"
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
                className={`flex items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
                  isSelected
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-border/45 bg-background/35 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                }`}
              >
                <img
                  src={image.url}
                  alt={image.caption || `Article image ${index + 1}`}
                  className="h-14 w-20 shrink-0 rounded-lg object-cover"
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
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `education-${Date.now()}`
  );
}
