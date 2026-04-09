import { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

interface CampaignStepEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function CampaignStepEditor({
  value,
  onChange,
  placeholder = "Write your email body here…",
  className,
  readOnly = false,
}: CampaignStepEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. loading different step)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("border rounded-md", className)}>
      {!readOnly && (
        <div className="flex flex-wrap gap-0.5 border-b p-1">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            aria-label="Bullet list"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            aria-label="Ordered list"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("link")}
            onPressedChange={setLink}
            aria-label="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Toggle>
          {editor.isActive("link") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
              }
              aria-label="Remove link"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none px-3 py-2 min-h-32 focus-within:outline-none",
          "[&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
        )}
      />
    </div>
  );
}
