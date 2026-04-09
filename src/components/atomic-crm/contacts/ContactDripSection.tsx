import { useGetManyReference, useRecordContext } from "ra-core";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Mail, XCircle } from "lucide-react";

import type { Contact, DripEnrollment } from "../types";
import { EnrollContactDialog } from "../campaigns/EnrollContactDialog";

const statusIcon = (e: DripEnrollment) => {
  if (e.suppressed)
    return <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
  if (e.completed_at)
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  if (e.last_sent_at)
    return <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
};

export function ContactDripSection() {
  const record = useRecordContext<Contact>();

  const { data: enrollments = [] } = useGetManyReference<DripEnrollment>(
    "drip_enrollments",
    {
      target: "contact_id",
      id: record?.id ?? 0,
      sort: { field: "enrolled_at", order: "DESC" },
      pagination: { page: 1, perPage: 20 },
    },
    { enabled: !!record?.id },
  );

  if (!record) return null;

  const enrolledCampaignIds = enrollments.map((e) => Number(e.campaign_id));

  return (
    <div className="space-y-2">
      {enrollments.length === 0 && (
        <p className="text-xs text-muted-foreground">Not enrolled yet.</p>
      )}
      {enrollments.map((e) => (
        <div key={e.id} className="flex items-center gap-2">
          {statusIcon(e)}
          <Link
            to={`/campaigns/${e.campaign_id}/show`}
            className="text-xs font-medium hover:underline truncate flex-1 min-w-0"
          >
            Campaign #{e.campaign_id}
          </Link>
          <Badge
            variant={
              e.suppressed
                ? "destructive"
                : e.completed_at
                  ? "default"
                  : "secondary"
            }
            className="text-xs shrink-0"
          >
            {e.suppressed ? "suppressed" : e.completed_at ? "done" : `step ${e.step}`}
          </Badge>
        </div>
      ))}
      <EnrollContactDialog excludeCampaignIds={enrolledCampaignIds} />
    </div>
  );
}
