import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HelpCircle } from "lucide-react";
import { useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Import MDX files as raw strings — same files as the Astro doc site.
// Update the MDX, redeploy the app, in-app help stays current automatically.
import campaignsRaw from "../../../../doc/src/content/docs/users/drip-campaigns.mdx?raw";
import segmentsRaw from "../../../../doc/src/content/docs/users/segments.mdx?raw";
import importRaw from "../../../../doc/src/content/docs/users/import-data.mdx?raw";

// Strip Astro-specific syntax so react-markdown can handle the content.
function prepareMarkdown(raw: string): string {
  return raw
    // Remove frontmatter block
    .replace(/^---[\s\S]*?---\n+/, "")
    // :::tip[Title]\n...\n::: → blockquote with bold title
    .replace(/:::tip\[([^\]]+)\]\n([\s\S]*?):::/g, "> **$1**\n>\n> $2\n")
    // :::tip\n...\n::: → plain blockquote
    .replace(/:::tip\n([\s\S]*?):::/g, "> **Tip:** $2\n")
    // :::note\n...\n:::
    .replace(/:::note\n([\s\S]*?):::/g, "> **Note:** $1\n")
    // Remove JSX-style className and video tags (from original Atomic docs)
    .replace(/<video[^>]*>.*?<\/video>/gs, "")
    .replace(/<[A-Z][^>]*>/g, "")
    .trim();
}

interface Topic {
  key: string;
  label: string;
  content: string;
  /** Route prefixes that auto-select this topic */
  routes: string[];
}

const TOPICS: Topic[] = [
  {
    key: "campaigns",
    label: "Campaigns",
    content: prepareMarkdown(campaignsRaw),
    routes: ["/campaigns"],
  },
  {
    key: "segments",
    label: "Segments",
    content: prepareMarkdown(segmentsRaw),
    routes: ["/segments"],
  },
  {
    key: "import",
    label: "Import & Export",
    content: prepareMarkdown(importRaw),
    routes: [],
  },
];

function topicForPath(pathname: string): string {
  const match = TOPICS.find((t) =>
    t.routes.some((r) => pathname.startsWith(r)),
  );
  return match?.key ?? "campaigns";
}

export function HelpDrawer() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(() =>
    topicForPath(location.pathname),
  );

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      // Auto-select topic matching current route when opening
      setActiveKey(topicForPath(location.pathname));
    }
    setOpen(isOpen);
  };

  const activeTopic = TOPICS.find((t) => t.key === activeKey) ?? TOPICS[0];

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
          title="Help"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Help</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[480px] sm:max-w-[480px] flex flex-col p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-0 shrink-0">
          <SheetTitle>Help</SheetTitle>
        </SheetHeader>

        {/* Topic tabs */}
        <div className="flex gap-1 px-4 pt-2 pb-0 border-b shrink-0">
          {TOPICS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveKey(t.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                t.key === activeKey
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="prose prose-sm dark:prose-invert max-w-none
            prose-headings:font-semibold
            prose-h2:text-base prose-h2:mt-6 prose-h2:mb-2
            prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1.5
            prose-p:text-sm prose-p:leading-relaxed
            prose-li:text-sm
            prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/40 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r
            prose-table:text-xs
            prose-th:font-medium prose-th:text-muted-foreground
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {activeTopic.content}
            </ReactMarkdown>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
