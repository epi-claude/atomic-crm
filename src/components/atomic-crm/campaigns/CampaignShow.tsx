import {
  RecordContextProvider,
  ShowBase,
  useGetManyReference,
  useShowContext,
} from "ra-core";
import { EditButton } from "@/components/admin/edit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Users } from "lucide-react";

import type { Campaign, CampaignStep } from "../types";
import { CampaignStepCard } from "./CampaignStepCard";
import { CampaignEnrollmentsPanel } from "./CampaignEnrollmentsPanel";

const statusColors: Record<
  Campaign["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  draft: "secondary",
  paused: "outline",
  archived: "destructive",
};

const CampaignShowContent = () => {
  const { record, isPending } = useShowContext<Campaign>();

  const { data: steps = [] } = useGetManyReference<CampaignStep>(
    "campaign_steps",
    {
      target: "campaign_id",
      id: record?.id ?? 0,
      sort: { field: "step_number", order: "ASC" },
      pagination: { page: 1, perPage: 20 },
    },
    { enabled: !!record?.id },
  );

  if (isPending || !record) return null;

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
          <Badge
            variant={statusColors[record.status]}
            className="capitalize"
          >
            {record.status}
          </Badge>
          <EditButton label="Edit" />
        </div>
      </div>

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

        <TabsContent value="steps" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Click a step to expand · click the pencil to edit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((step, idx) => (
                <RecordContextProvider key={step.id} value={step}>
                  <CampaignStepCard
                    step={step}
                    isLast={idx === steps.length - 1}
                  />
                </RecordContextProvider>
              ))}
            </CardContent>
          </Card>
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
