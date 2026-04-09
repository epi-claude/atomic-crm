import { useListContext, useRecordContext } from "ra-core";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Mail, XCircle } from "lucide-react";

import type { Campaign, DripEnrollment } from "../types";
import { EnrollmentEventStats } from "./EnrollmentEventStats";

const statusIcon = (e: DripEnrollment) => {
  if (e.suppressed)
    return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  if (e.completed_at)
    return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
  if (e.last_sent_at)
    return <Mail className="h-4 w-4 text-blue-500 shrink-0" />;
  return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
};

export const enrollmentStatus = (e: DripEnrollment, totalSteps: number) => {
  if (e.suppressed) return e.suppressed_reason ?? "suppressed";
  if (e.completed_at) return "completed";
  return `step ${e.step} / ${totalSteps}`;
};

const EnrollmentsList = ({ totalSteps }: { totalSteps: number }) => {
  const { data, isPending, total } = useListContext<DripEnrollment>();
  if (isPending) return null;
  if (!data?.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No contacts enrolled yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-2">
        {total ?? data.length} total
      </p>
      {data.map((enrollment) => (
        <div
          key={enrollment.id}
          className="flex items-center gap-3 py-2 border-b last:border-0"
        >
          {statusIcon(enrollment)}
          <div className="flex-1 min-w-0">
            <Link
              to={`/contacts/${enrollment.contact_id}/show`}
              className="text-sm font-medium hover:underline truncate block"
            >
              Contact #{enrollment.contact_id}
            </Link>
            <p className="text-xs text-muted-foreground">
              {enrollmentStatus(enrollment, totalSteps)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <EnrollmentEventStats enrollmentId={enrollment.id} />
            <Badge
              variant={
                enrollment.suppressed
                  ? "destructive"
                  : enrollment.completed_at
                    ? "default"
                    : "secondary"
              }
              className="text-xs"
            >
              {enrollment.suppressed
                ? "suppressed"
                : enrollment.completed_at
                  ? "done"
                  : "active"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export function CampaignEnrollmentsPanel({
  totalSteps,
}: {
  totalSteps: number;
}) {
  const record = useRecordContext<Campaign>();
  if (!record) return null;

  return (
    <ReferenceManyField
      reference="drip_enrollments"
      target="campaign_id"
      sort={{ field: "enrolled_at", order: "DESC" }}
      perPage={50}
    >
      <EnrollmentsList totalSteps={totalSteps} />
    </ReferenceManyField>
  );
}
