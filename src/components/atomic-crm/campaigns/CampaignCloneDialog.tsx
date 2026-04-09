// Dialog for cloning a campaign with all its steps.
// Pre-fills name ("Copy of X") and slug (auto-derived, editable).
// Status is always draft. Redirects to new campaign show page on success.

import { useEffect, useState } from "react";
import { useNotify, useRecordContext } from "ra-core";
import { useNavigate } from "react-router";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import type { Campaign, CampaignStep } from "../types";
import { supabase } from "../providers/supabase/supabase";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CampaignCloneDialog() {
  const record = useRecordContext<Campaign>();
  const notify = useNotify();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});

  // Pre-fill when dialog opens
  useEffect(() => {
    if (open && record) {
      const defaultName = `Copy of ${record.name}`;
      setName(defaultName);
      setSlug(toSlug(defaultName));
      setSlugManuallyEdited(false);
      setErrors({});
    }
  }, [open, record]);

  // Auto-derive slug from name unless user manually edited it
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(toSlug(value));
    }
    if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
    if (errors.slug) setErrors((e) => ({ ...e, slug: undefined }));
  };

  const validate = () => {
    const e: { name?: string; slug?: string } = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!slug.trim()) e.slug = "Slug is required.";
    else if (!/^[a-z0-9-]+$/.test(slug.trim()))
      e.slug = "Slug may only contain lowercase letters, numbers, and hyphens.";
    return e;
  };

  const handleClone = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setCloning(true);
    try {
      // 1. Fetch original steps
      const { data: steps, error: stepsError } = await supabase
        .from("campaign_steps")
        .select("step_number, subject, html_body, delay_days")
        .eq("campaign_id", record!.id)
        .order("step_number", { ascending: true });

      if (stepsError) throw stepsError;

      // 2. Insert new campaign
      const { data: newCampaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          name: name.trim(),
          slug: slug.trim(),
          description: record!.description ?? null,
          status: "draft",
        })
        .select("id")
        .single();

      if (campaignError) {
        if (campaignError.message?.includes("unique") || campaignError.code === "23505") {
          setErrors({ slug: "This slug is already in use — choose a different one." });
          setCloning(false);
          return;
        }
        throw campaignError;
      }

      // 3. Copy steps to new campaign
      if (steps && steps.length > 0) {
        const { error: stepsInsertError } = await supabase
          .from("campaign_steps")
          .insert(
            steps.map((s) => ({
              campaign_id: newCampaign.id,
              step_number: s.step_number,
              subject: s.subject,
              html_body: s.html_body,
              delay_days: s.delay_days,
            })),
          );
        if (stepsInsertError) throw stepsInsertError;
      }

      notify(`Campaign cloned — "${name.trim()}" created as draft`, {
        type: "success",
      });
      setOpen(false);
      navigate(`/campaigns/${newCampaign.id}/show`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Clone failed";
      notify(msg, { type: "error" });
    } finally {
      setCloning(false);
    }
  };

  if (!record) return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Copy className="h-3.5 w-3.5 mr-1.5" />
        Clone
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clone campaign</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="clone-name">Name</Label>
              <Input
                id="clone-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Campaign name"
                className={errors.name ? "border-destructive" : ""}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clone-slug">Slug</Label>
              <Input
                id="clone-slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="url-key"
                className={errors.slug ? "border-destructive" : ""}
              />
              {errors.slug ? (
                <p className="text-xs text-destructive">{errors.slug}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Auto-derived from name · lowercase letters, numbers, hyphens
                </p>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              All {record.name} steps will be copied. Status will be set to{" "}
              <strong>Draft</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={cloning}
            >
              Cancel
            </Button>
            <Button onClick={handleClone} disabled={cloning}>
              {cloning ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1.5" />
              )}
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
