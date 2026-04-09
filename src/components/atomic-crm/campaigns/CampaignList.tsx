import { useListContext } from "ra-core";
import { List } from "@/components/admin/list";
import { ReferenceManyCount } from "@/components/admin/reference-many-count";
import { RecordContextProvider } from "ra-core";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import type { Campaign } from "../types";

const statusColors: Record<
  Campaign["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  draft: "secondary",
  paused: "outline",
  archived: "destructive",
};

const CampaignListActions = () => (
  <Button asChild size="sm">
    <Link to="/campaigns/create">
      <Plus className="h-4 w-4 mr-1" />
      New Campaign
    </Link>
  </Button>
);

const CampaignGrid = () => {
  const { data, isPending } = useListContext<Campaign>();
  if (isPending) return null;
  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
        <p className="text-base">No campaigns yet.</p>
        <Button asChild size="sm">
          <Link to="/campaigns/create">Create your first campaign</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {data.map((campaign) => (
        <RecordContextProvider key={campaign.id} value={campaign}>
          <Link
            to={`/campaigns/${campaign.id}/show`}
            className="no-underline"
          >
            <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-semibold text-sm leading-tight">
                  {campaign.name}
                </span>
                <Badge variant={statusColors[campaign.status]} className="shrink-0 capitalize text-xs">
                  {campaign.status}
                </Badge>
              </div>
              {campaign.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {campaign.description}
                </p>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>
                  <ReferenceManyCount
                    reference="campaign_steps"
                    target="campaign_id"
                    label="steps"
                  />{" "}
                  steps
                </span>
                <span>
                  <ReferenceManyCount
                    reference="drip_enrollments"
                    target="campaign_id"
                    label="enrolled"
                  />{" "}
                  enrolled
                </span>
              </div>
            </div>
          </Link>
        </RecordContextProvider>
      ))}
    </div>
  );
};

export const CampaignList = () => (
  <List title="Campaigns" actions={<CampaignListActions />} perPage={50}>
    <CampaignGrid />
  </List>
);
