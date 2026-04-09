import {
  RecordContextProvider,
  ShowBase,
  useCreate,
  useDelete,
  useGetManyReference,
  useNotify,
  useShowContext,
} from "ra-core";
import { EditButton } from "@/components/admin/edit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Info, Layers, Plus, Users } from "lucide-react";

import type { Campaign, CampaignStep } from "../types";
import { CampaignStepCard } from "./CampaignStepCard";
import { CampaignEnrollmentsPanel } from "./CampaignEnrollmentsPanel";
import { CampaignAnalyticsHeader } from "./CampaignAnalyticsHeader";
import { CampaignCloneDialog } from "./CampaignCloneDialog";

const statusColors: Record<
  Campaign["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  draft: "secondary",
  paused: "outline",
  archived: "destructive",
};

const SOFT_WARN_AT = 6;
const SOFT_CAP = 8;

function BestPracticesPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
          <Info className="h-4 w-4" />
          <span className="sr-only">Best practices</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-3 text-sm">
          <p className="font-semibold">Campaign length best practices</p>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 pr-3 font-medium text-muted-foreground">Steps</th>
                <th className="text-left py-1 pr-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left py-1 font-medium text-muted-foreground">Verdict</th>
              </tr>
            </thead>
            <tbody className="[&_tr]:border-b [&_tr:last-child]:border-0">
              <tr>
                <td className="py-1.5 pr-3 font-mono">1</td>
                <td className="py-1.5 pr-3 text-muted-foreground">Single email</td>
                <td className="py-1.5 text-muted-foreground">Too short — barely a campaign</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-3 font-mono">2–3</td>
                <td className="py-1.5 pr-3 text-muted-foreground">Short</td>
                <td className="py-1.5 text-muted-foreground">Good for re-engagement, event invites</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-3 font-mono">4–6</td>
                <td className="py-1.5 pr-3">Standard</td>
                <td className="py-1.5 font-medium text-green-600 dark:text-green-400">✓ Ideal for most B2B outreach</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-3 font-mono">7–9</td>
                <td className="py-1.5 pr-3 text-muted-foreground">Long</td>
                <td className="py-1.5 text-muted-foreground">Works for high-intent lists (trials, inbound)</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-3 font-mono">10+</td>
                <td className="py-1.5 pr-3 text-muted-foreground">Nurture</td>
                <td className="py-1.5 text-muted-foreground">Newsletter territory, not cold outreach</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-3 font-mono">15+</td>
                <td className="py-1.5 pr-3 text-muted-foreground">Excessive</td>
                <td className="py-1.5 text-destructive">Likely hurting deliverability</td>
              </tr>
            </tbody>
          </table>

          <div className="pt-1 border-t space-y-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Spacing matters more than count</p>
            <p>
              A 3-step campaign over 3 days is far more aggressive than a
              6-step campaign over 6 weeks. Use the <strong>delay (days)</strong> field
              on each step to control cadence.
            </p>
            <p>
              Typical B2B cadence: day 0 → +3 days → +7 days → +14 days.
              Longer gaps for colder lists.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const CampaignShowContent = () => {
  const { record, isPending } = useShowContext<Campaign>();
  const notify = useNotify();

  const { data: steps = [], refetch } = useGetManyReference<CampaignStep>(
    "campaign_steps",
    {
      target: "campaign_id",
      id: record?.id ?? 0,
      sort: { field: "step_number", order: "ASC" },
      pagination: { page: 1, perPage: 20 },
    },
    { enabled: !!record?.id },
  );

  const [create, { isPending: isCreating }] = useCreate();
  const [deleteOne, { isPending: isDeleting }] = useDelete();

  const handleAddStep = () => {
    const nextNumber = steps.length > 0
      ? Math.max(...steps.map((s) => s.step_number)) + 1
      : 1;
    create(
      "campaign_steps",
      {
        data: {
          campaign_id: record!.id,
          step_number: nextNumber,
          subject: "",
          html_body: "",
          delay_days: 7,
        },
      },
      {
        onSuccess: () => {
          notify(`Step ${nextNumber} added`, { type: "success" });
          refetch();
        },
        onError: () => notify("Failed to add step", { type: "error" }),
      },
    );
  };

  const handleDeleteStep = (step: CampaignStep) => {
    deleteOne(
      "campaign_steps",
      { id: step.id, previousData: step },
      {
        onSuccess: () => {
          notify(`Step ${step.step_number} deleted`, { type: "success" });
          refetch();
        },
        onError: () => notify("Failed to delete step", { type: "error" }),
      },
    );
  };

  if (isPending || !record) return null;

  const lastStep = steps.length > 0
    ? steps.reduce((a, b) => (a.step_number > b.step_number ? a : b))
    : null;

  const atCap = steps.length >= SOFT_CAP;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{record.name}</h1>
          {record.description && (
            <p className="text-muted-foreground mt-1">{record.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={statusColors[record.status]} className="capitalize">
            {record.status}
          </Badge>
          <CampaignCloneDialog />
          <EditButton label="Edit" />
        </div>
      </div>

      {/* Analytics */}
      <CampaignAnalyticsHeader campaignId={record.id} />

      {/* Tabs */}
      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps" className="gap-1.5">
            <Layers className="h-4 w-4" />
            Steps ({steps.length})
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="gap-1.5">
            <Users className="h-4 w-4" />
            Enrollments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Click a step to expand · click the pencil to edit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((step) => (
                <RecordContextProvider key={step.id} value={step}>
                  <CampaignStepCard
                    step={step}
                    isLast={step.id === lastStep?.id}
                    canDelete={step.id === lastStep?.id && steps.length > 1}
                    onDelete={() => handleDeleteStep(step)}
                  />
                </RecordContextProvider>
              ))}
            </CardContent>
          </Card>

          {/* Soft-cap warning */}
          {steps.length >= SOFT_WARN_AT && (
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription>
                {atCap
                  ? `${SOFT_CAP}-step cap reached. Campaigns longer than ${SOFT_CAP} steps risk hurting deliverability and unsubscribe rates for cold/warm outreach.`
                  : `${steps.length} steps is on the longer side for cold/warm outreach. Consider whether each step adds value — more steps can increase unsubscribe rates.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Add step + info */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddStep}
              disabled={isCreating || isDeleting || atCap}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add step
            </Button>
            <BestPracticesPopover />
            {atCap && (
              <span className="text-xs text-muted-foreground">
                Maximum {SOFT_CAP} steps reached
              </span>
            )}
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <CampaignEnrollmentsPanel totalSteps={steps.length} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const CampaignShow = () => (
  <ShowBase>
    <CampaignShowContent />
  </ShowBase>
);
