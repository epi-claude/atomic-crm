import { useState } from "react";
import { useCreate, useGetList, useNotify, useRecordContext } from "ra-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

import type { Campaign, Contact } from "../types";

export function EnrollContactDialog({
  excludeCampaignIds = [],
}: {
  excludeCampaignIds?: number[];
}) {
  const record = useRecordContext<Contact>();
  const notify = useNotify();
  const [open, setOpen] = useState(false);

  const { data: campaigns, isPending } = useGetList<Campaign>("campaigns", {
    filter: { status: "active" },
    sort: { field: "name", order: "ASC" },
    pagination: { page: 1, perPage: 50 },
  });

  const [create, { isPending: enrolling }] = useCreate();

  const enroll = (campaignId: number) => {
    if (!record) return;
    create(
      "drip_enrollments",
      {
        data: {
          contact_id: record.id,
          campaign_id: campaignId,
          step: 0,
          enrolled_at: new Date().toISOString(),
          suppressed: false,
        },
      },
      {
        onSuccess: () => {
          notify("Contact enrolled", { type: "success" });
          setOpen(false);
        },
        onError: () => notify("Failed to enroll contact", { type: "error" }),
      },
    );
  };

  const available = (campaigns ?? []).filter(
    (c) => !excludeCampaignIds.includes(Number(c.id)),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <UserPlus className="h-3.5 w-3.5 mr-2" />
          Enroll in campaign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll in Campaign</DialogTitle>
        </DialogHeader>
        {isPending && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Loading…
          </p>
        )}
        {!isPending && available.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No active campaigns available.
          </p>
        )}
        <div className="space-y-2 mt-2">
          {available.map((campaign) => (
            <div
              key={campaign.id}
              className="flex items-center justify-between border rounded-md px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{campaign.name}</p>
                {campaign.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {campaign.description}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => enroll(Number(campaign.id))}
                disabled={enrolling}
              >
                Enroll
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
