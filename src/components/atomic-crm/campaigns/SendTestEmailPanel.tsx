// Inline panel for sending a test email for a campaign step.
// Remembers last-used address in localStorage.
// Validates email format before hitting the edge function.

import { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotify } from "ra-core";

import { supabase } from "../providers/supabase/supabase";

const STORAGE_KEY = "drip_test_email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SendTestEmailPanelProps {
  stepId: number | string;
}

export function SendTestEmailPanel({ stepId }: SendTestEmailPanelProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notify = useNotify();

  // Pre-fill: localStorage → logged-in user's email
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setEmail(stored);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  const validate = (value: string) => {
    if (!value.trim()) return "Email address is required.";
    if (!EMAIL_RE.test(value.trim())) return "Enter a valid email address.";
    return null;
  };

  const handleSend = async () => {
    const validationError = validate(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSending(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-test-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ step_id: stepId, to_email: email.trim() }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }

      localStorage.setItem(STORAGE_KEY, email.trim());
      notify(`Test email sent to ${email.trim()}`, { type: "success" });
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {!open ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          Send test
        </Button>
      ) : (
        <div className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/30">
          <Label className="text-xs text-muted-foreground">
            Send test to
          </Label>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="test@example.com"
                className={error ? "border-destructive" : ""}
                autoFocus
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending}
              type="button"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              type="button"
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {"{first_name}"} will appear as "Test User". Last used address is remembered.
          </p>
        </div>
      )}
    </div>
  );
}
