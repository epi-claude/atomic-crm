// Drip email history for a single contact — shown in the Emails tab.
// Calls get_contact_email_history() RPC: one query returns all enrollments
// + their events, grouped client-side by enrollment_id.

import { useEffect, useState } from "react";
import { useRecordContext } from "ra-core";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Eye,
  MousePointer,
  AlertCircle,
  AlertTriangle,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
} from "lucide-react";

import type { Contact } from "../types";
import { supabase } from "../providers/supabase/supabase";
import { RelativeDate } from "../misc/RelativeDate";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmailHistoryRow {
  enrollment_id: number;
  campaign_id: number;
  campaign_name: string;
  step: number;
  enrolled_at: string;
  completed_at: string | null;
  suppressed: boolean;
  suppressed_reason: string | null;
  event_id: number | null;
  event_type: string | null;
  occurred_at: string | null;
  url: string | null;
}

interface EnrollmentGroup {
  enrollment_id: number;
  campaign_id: number;
  campaign_name: string;
  step: number;
  enrolled_at: string;
  completed_at: string | null;
  suppressed: boolean;
  suppressed_reason: string | null;
  events: {
    event_id: number;
    event_type: string;
    occurred_at: string;
    url: string | null;
  }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; className: string }
> = {
  delivered: {
    icon: <Send className="h-3.5 w-3.5" />,
    label: "Delivered",
    className: "text-blue-500",
  },
  opened: {
    icon: <Eye className="h-3.5 w-3.5" />,
    label: "Opened",
    className: "text-blue-500",
  },
  clicked: {
    icon: <MousePointer className="h-3.5 w-3.5" />,
    label: "Clicked",
    className: "text-green-500",
  },
  bounced: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: "Bounced",
    className: "text-destructive",
  },
  complained: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    label: "Marked spam",
    className: "text-destructive",
  },
  unsubscribed: {
    icon: <UserX className="h-3.5 w-3.5" />,
    label: "Unsubscribed",
    className: "text-orange-500",
  },
};

function enrollmentStatusBadge(e: EnrollmentGroup) {
  if (e.suppressed)
    return (
      <Badge variant="destructive" className="text-xs">
        {e.suppressed_reason ?? "suppressed"}
      </Badge>
    );
  if (e.completed_at)
    return (
      <Badge variant="default" className="text-xs">
        completed
      </Badge>
    );
  if (e.events.length > 0)
    return (
      <Badge variant="secondary" className="text-xs">
        active · step {e.step}
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs">
      pending
    </Badge>
  );
}

function enrollmentStatusIcon(e: EnrollmentGroup) {
  if (e.suppressed) return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  if (e.completed_at) return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
  if (e.events.length > 0) return <Mail className="h-4 w-4 text-blue-500 shrink-0" />;
  return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventRow({
  event,
}: {
  event: EnrollmentGroup["events"][number];
}) {
  const config = EVENT_CONFIG[event.event_type] ?? {
    icon: <Mail className="h-3.5 w-3.5" />,
    label: event.event_type,
    className: "text-muted-foreground",
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${config.className}`}>
      <div className="flex items-center gap-1.5 min-w-[90px]">
        {config.icon}
        <span>{config.label}</span>
      </div>
      <span className="text-muted-foreground">
        <RelativeDate date={event.occurred_at} />
      </span>
      {event.event_type === "clicked" && event.url && (
        <span
          className="text-muted-foreground truncate max-w-[200px]"
          title={event.url}
        >
          {event.url}
        </span>
      )}
    </div>
  );
}

function EnrollmentCard({ enrollment }: { enrollment: EnrollmentGroup }) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        {enrollmentStatusIcon(enrollment)}
        <Link
          to={`/campaigns/${enrollment.campaign_id}/show`}
          className="text-sm font-medium hover:underline flex-1 truncate"
        >
          {enrollment.campaign_name}
        </Link>
        {enrollmentStatusBadge(enrollment)}
      </div>

      {/* Events */}
      {enrollment.events.length > 0 ? (
        <div className="pl-6 space-y-1.5 border-l ml-2">
          {enrollment.events.map((ev) => (
            <EventRow key={ev.event_id} event={ev} />
          ))}
        </div>
      ) : (
        <p className="pl-6 text-xs text-muted-foreground">
          Enrolled <RelativeDate date={enrollment.enrolled_at} /> — awaiting first send
        </p>
      )}

      {/* Enrolled date */}
      <p className="text-xs text-muted-foreground pl-6">
        Enrolled <RelativeDate date={enrollment.enrolled_at} />
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ContactEmailHistory() {
  const record = useRecordContext<Contact>();
  const [enrollments, setEnrollments] = useState<EnrollmentGroup[] | null>(null);

  useEffect(() => {
    if (!record?.id) return;
    supabase
      .rpc("get_contact_email_history", { p_contact_id: record.id })
      .then(({ data, error }) => {
        if (error || !data) {
          setEnrollments([]);
          return;
        }

        // Group flat rows by enrollment_id
        const map = new Map<number, EnrollmentGroup>();
        for (const row of data as EmailHistoryRow[]) {
          if (!map.has(row.enrollment_id)) {
            map.set(row.enrollment_id, {
              enrollment_id: row.enrollment_id,
              campaign_id: row.campaign_id,
              campaign_name: row.campaign_name,
              step: row.step,
              enrolled_at: row.enrolled_at,
              completed_at: row.completed_at,
              suppressed: row.suppressed,
              suppressed_reason: row.suppressed_reason,
              events: [],
            });
          }
          if (row.event_id && row.event_type && row.occurred_at) {
            map.get(row.enrollment_id)!.events.push({
              event_id: row.event_id,
              event_type: row.event_type,
              occurred_at: row.occurred_at,
              url: row.url,
            });
          }
        }

        setEnrollments(Array.from(map.values()));
      });
  }, [record?.id]);

  if (enrollments === null) return null;

  if (enrollments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No drip emails sent yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {enrollments.map((e) => (
        <EnrollmentCard key={e.enrollment_id} enrollment={e} />
      ))}
    </div>
  );
}
