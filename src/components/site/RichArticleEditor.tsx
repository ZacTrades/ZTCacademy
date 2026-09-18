import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Palette,
  Quote,
  Redo2,
  Type,
  Underline as UnderlineIcon,
  Undo2,
  YoutubeIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Label } from "@/components/ui/label";

const EMPTY_ARTICLE_CONTENT = "<p></p>";

const fontOptions = [
  { label: "Default", value: "" },
  { label: "Display", value: "Space Grotesk" },
  { label: "Clean", value: "Inter" },
  { label: "Serif", value: "Georgia" },
  { label: "Mono", value: "JetBrains Mono" },
];

const colorOptions = [
  { label: "White", value: "#f8fafc" },
  { label: "Blue", value: "#0ea5ff" },
  { label: "Gold", value: "#f7c948" },
  { label: "Green", value: "#22c55e" },
  { label: "Red", value: "#ff3b4f" },
];

export function RichArticleEditor({
  id,
  label,
  value,
  onChange,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: {
          class: "text-electric underline underline-offset-4",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-3xl border border-border/50 shadow-[0_24px_90px_-62px_hsl(var(--primary)/0.9)]",
          loading: "lazy",
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: {
          class: "aspect-video w-full overflow-hidden rounded-3xl border border-primary/25 shadow-[0_24px_90px_-62px_hsl(var(--primary)/0.9)]",
        },
      }),
    ],
    content: value || EMPTY_ARTICLE_CONTENT,
    editorProps: {
      attributes: {
        id,
        class:
          "min-h-[430px] focus:outline-none text-base leading-8 text-muted-foreground md:text-lg md:leading-9",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    const nextHtml = value || EMPTY_ARTICLE_CONTENT;

    if (currentHtml !== nextHtml) {
      editor.commands.setContent(nextHtml, { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Paste the link URL", previousUrl ?? "https://");

    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const addImageByUrl = () => {
    if (!editor) return;

    const url = window.prompt("Paste the image URL", "https://");
    if (!url?.trim()) return;

    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const addYouTube = () => {
    if (!editor) return;

    const url = window.prompt("Paste the YouTube video URL", "https://www.youtube.com/watch?v=");
    if (!url?.trim()) return;

    editor.commands.setYoutubeVideo({ src: url.trim(), width: 900, height: 506 });
  };

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        tabIndex={-1}
        aria-hidden="true"
        value={getValidationValue(value)}
        onChange={() => undefined}
        required={required}
        className="pointer-events-none absolute h-px w-px opacity-0"
      />

      <div className="mt-2 max-h-[78vh] overflow-y-auto overscroll-contain rounded-3xl border border-border/60 bg-background/45 shadow-[0_24px_80px_-64px_hsl(var(--primary)/0.9)]">
        <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 rounded-t-3xl border-b border-border/50 bg-card/95 p-3 shadow-[0_22px_70px_-52px_hsl(var(--primary)/0.9)] backdrop-blur-xl">
          <ToolbarButton label="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Underline" active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Heading 1" active={editor?.isActive("heading", { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Heading 2" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Paragraph" active={editor?.isActive("paragraph")} onClick={() => editor?.chain().focus().setParagraph().run()}>
            <Type className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Bullet list" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Quote" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Align left" active={editor?.isActive({ textAlign: "left" })} onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Align center" active={editor?.isActive({ textAlign: "center" })} onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Align right" active={editor?.isActive({ textAlign: "right" })} onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <select
            aria-label="Font family"
            value={(editor?.getAttributes("textStyle").fontFamily as string | undefined) ?? ""}
            onChange={(event) => {
              const font = event.target.value;
              if (!editor) return;
              if (font) editor.chain().focus().setFontFamily(font).run();
              else editor.chain().focus().unsetFontFamily().run();
            }}
            className="h-10 rounded-xl border border-border/60 bg-background/70 px-3 text-xs font-bold text-foreground outline-none focus:border-primary"
          >
            {fontOptions.map((font) => (
              <option key={font.label} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Text color"
            value={(editor?.getAttributes("textStyle").color as string | undefined) ?? ""}
            onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()}
            className="h-10 rounded-xl border border-border/60 bg-background/70 px-3 text-xs font-bold text-foreground outline-none focus:border-primary"
          >
            <option value="">Color</option>
            {colorOptions.map((color) => (
              <option key={color.label} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
          <ToolbarButton label="Text color" onClick={() => editor?.chain().focus().setColor("#0ea5ff").run()}>
            <Palette className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Add link" active={editor?.isActive("link")} onClick={setLink}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Add image URL" onClick={addImageByUrl}>
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Add YouTube" onClick={addYouTube}>
            <YoutubeIcon className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Undo" onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Redo" onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <EditorContent
          editor={editor}
          className="rich-article-editor p-5 [&_.ProseMirror>*+*]:mt-4 [&_.ProseMirror_a]:text-electric [&_.ProseMirror_a]:underline [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary/50 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-foreground [&_.ProseMirror_h1]:font-display [&_.ProseMirror_h1]:text-4xl [&_.ProseMirror_h1]:font-black [&_.ProseMirror_h1]:text-foreground [&_.ProseMirror_h2]:font-display [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-black [&_.ProseMirror_h2]:text-foreground [&_.ProseMirror_h3]:font-display [&_.ProseMirror_h3]:text-2xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:text-foreground [&_.ProseMirror_img]:my-6 [&_.ProseMirror_img]:max-h-[680px] [&_.ProseMirror_img]:w-full [&_.ProseMirror_img]:object-cover [&_.ProseMirror_li]:ml-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-['Write_your_article_here...'] [&_.ProseMirror_ul]:list-disc"
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-xl border text-sm transition-colors ${
        active
          ? "border-gold/45 bg-gold/15 text-gold shadow-[0_0_26px_-14px_hsl(var(--gold)/0.9)]"
          : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 hidden h-8 w-px bg-border/60 sm:inline-block" />;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
}

function getValidationValue(value: string) {
  const text = stripHtml(value).trim();
  if (text) return text;

  return /<(img|iframe)\b/i.test(value) ? "media" : "";
}
