// Dialog to enroll all contacts in a segment into a campaign.
// Calls enroll_segment_contacts(segment_id, campaign_id) RPC.

import { useState } from "react";
import { useGetList, useNotify, useRecordContext } from "ra-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

import { supabase } from "../providers/supabase/supabase";
import type { Campaign, Segment } from "../types";

export function SegmentEnrollDialog() {
  const record = useRecordContext<Segment>();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const { data: campaigns, isPending } = useGetList<Campaign>("campaigns", {
    filter: { status: "active" },
    sort: { field: "name", order: "ASC" },
    pagination: { page: 1, perPage: 50 },
  });

  const enroll = async (campaignId: number) => {
    if (!record) return;
    setEnrolling(true);
    const { data, error } = await supabase.rpc("enroll_segment_contacts", {
      p_segment_id: Number(record.id),
      p_campaign_id: campaignId,
    });
    setEnrolling(false);
    if (error) {
      notify(`Enrollment failed: ${error.message}`, { type: "error" });
    } else {
      notify(`Enrolled ${data} new contact${data !== 1 ? "s" : ""}`, {
        type: "success",
      });
      setOpen(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Enroll in Campaign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll Segment in Campaign</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          All matching contacts will be enrolled. Already-enrolled contacts are
          skipped.
        </p>
        {isPending && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Loading…
          </p>
        )}
        {!isPending && !campaigns?.length && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No active campaigns.
          </p>
        )}
        <div className="space-y-2 mt-2">
          {campaigns?.map((campaign) => (
            <div
              key={campaign.id}
              className="flex items-center justify-between border rounded-md px-3 py-2"
            >
              <p className="text-sm font-medium">{campaign.name}</p>
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
