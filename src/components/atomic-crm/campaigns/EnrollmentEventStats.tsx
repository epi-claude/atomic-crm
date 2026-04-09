// Shows open/click counts for a single enrollment, fetched from email_events.
// Used inline in the enrollments list — keeps it compact.

import { useGetManyReference } from "ra-core";
import { Eye, MousePointer, Send } from "lucide-react";

import type { EmailEvent } from "../types";

interface EnrollmentEventStatsProps {
  enrollmentId: number | string;
}

export function EnrollmentEventStats({ enrollmentId }: EnrollmentEventStatsProps) {
  const { data: events = [], isPending } = useGetManyReference<EmailEvent>(
    "email_events",
    {
      target: "enrollment_id",
      id: enrollmentId,
      sort: { field: "occurred_at", order: "DESC" },
      pagination: { page: 1, perPage: 100 },
    },
  );

  if (isPending) return null;
  if (!events.length) return null;

  const delivered = events.filter((e) => e.event_type === "delivered").length;
  const opens = events.filter((e) => e.event_type === "opened").length;
  const clicks = events.filter((e) => e.event_type === "clicked").length;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {delivered > 0 && (
        <span className="flex items-center gap-0.5" title="Delivered">
          <Send className="h-3 w-3" />
          {delivered}
        </span>
      )}
      {opens > 0 && (
        <span className="flex items-center gap-0.5 text-blue-500" title="Opens">
          <Eye className="h-3 w-3" />
          {opens}
        </span>
      )}
      {clicks > 0 && (
        <span className="flex items-center gap-0.5 text-green-500" title="Clicks">
          <MousePointer className="h-3 w-3" />
          {clicks}
        </span>
      )}
    </div>
  );
}
