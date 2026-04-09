import { useState } from "react";
import { useUpdate, useNotify } from "ra-core";
import { useForm } from "react-hook-form";
import { ChevronDown, ChevronUp, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { CampaignStep } from "../types";
import { CampaignStepEditor } from "./CampaignStepEditor";
import { SendTestEmailPanel } from "./SendTestEmailPanel";

interface CampaignStepCardProps {
  step: CampaignStep;
  isLast: boolean;
}

interface StepFormValues {
  subject: string;
  html_body: string;
  delay_days: number;
}

export function CampaignStepCard({ step, isLast }: CampaignStepCardProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const notify = useNotify();
  const [update, { isPending }] = useUpdate();

  const { register, handleSubmit, setValue, watch } =
    useForm<StepFormValues>({
      defaultValues: {
        subject: step.subject,
        html_body: step.html_body,
        delay_days: step.delay_days,
      },
    });

  const htmlBody = watch("html_body");

  const onSave = handleSubmit(async (values) => {
    await update(
      "campaign_steps",
      { id: step.id, data: values, previousData: step },
      {
        onSuccess: () => {
          notify("Step saved", { type: "success" });
          setEditing(false);
        },
        onError: () => notify("Failed to save step", { type: "error" }),
      },
    );
  });

  const delayLabel =
    step.delay_days === 0
      ? "Send immediately"
      : `Send after ${step.delay_days} day${step.delay_days !== 1 ? "s" : ""}`;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Step header */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 bg-muted/30",
          !editing && "cursor-pointer hover:bg-muted/50 transition-colors",
        )}
        onClick={() => !editing && setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
          {step.step_number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{step.subject}</p>
          <p className="text-xs text-muted-foreground">{delayLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          {isLast && (
            <Badge variant="secondary" className="text-xs">
              Final
            </Badge>
          )}
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
                setExpanded(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {!editing &&
            (expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ))}
        </div>
      </div>

      {/* Expanded / editing body */}
      {(expanded || editing) && (
        <div className="p-4 space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor={`subject-${step.id}`}>Subject</Label>
                  <Input
                    id={`subject-${step.id}`}
                    {...register("subject")}
                    placeholder="Email subject"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <code>{"{first_name}"}</code> to personalise.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`delay-${step.id}`}>Delay (days)</Label>
                  <Input
                    id={`delay-${step.id}`}
                    type="number"
                    min={0}
                    {...register("delay_days", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Body</Label>
                <CampaignStepEditor
                  value={htmlBody}
                  onChange={(html) => setValue("html_body", html)}
                  placeholder="Email body — use {first_name} to personalise."
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <SendTestEmailPanel stepId={step.id} />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(false)}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={onSave} disabled={isPending}>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div
                className="prose prose-sm max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: step.html_body }}
              />
              <SendTestEmailPanel stepId={step.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
