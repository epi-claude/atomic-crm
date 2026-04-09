// Campaign-level aggregate stats: enrolled, delivered, open rate, click rate, completed, suppressed.
// Calls get_campaign_stats() RPC — one round-trip for all numbers.

import { useEffect, useState } from "react";
import { Mail, Eye, MousePointer, CheckCircle2, XCircle, Users } from "lucide-react";
import { supabase } from "../providers/supabase/supabase";

interface CampaignStats {
  total_enrolled: number;
  total_completed: number;
  total_suppressed: number;
  total_delivered: number;
  unique_opens: number;
  unique_clicks: number;
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}

const StatTile = ({ icon, label, value, sub }: StatTileProps) => (
  <div className="flex flex-col gap-1 px-4 py-3 rounded-lg bg-muted/40 min-w-0">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  </div>
);

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function CampaignAnalyticsHeader({
  campaignId,
}: {
  campaignId: number | string;
}) {
  const [stats, setStats] = useState<CampaignStats | null>(null);

  useEffect(() => {
    supabase
      .rpc("get_campaign_stats", { p_campaign_id: campaignId })
      .single()
      .then(({ data, error }) => {
        if (!error && data) setStats(data as CampaignStats);
      });
  }, [campaignId]);

  if (!stats) return null;

  const openRate = pct(stats.unique_opens, stats.total_delivered);
  const clickRate = pct(stats.unique_clicks, stats.total_delivered);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      <StatTile
        icon={<Users className="h-3.5 w-3.5" />}
        label="Enrolled"
        value={stats.total_enrolled}
      />
      <StatTile
        icon={<Mail className="h-3.5 w-3.5" />}
        label="Delivered"
        value={stats.total_delivered}
      />
      <StatTile
        icon={<Eye className="h-3.5 w-3.5" />}
        label="Open rate"
        value={openRate}
        sub={
          stats.unique_opens > 0
            ? `${stats.unique_opens} contacts`
            : undefined
        }
      />
      <StatTile
        icon={<MousePointer className="h-3.5 w-3.5" />}
        label="Click rate"
        value={clickRate}
        sub={
          stats.unique_clicks > 0
            ? `${stats.unique_clicks} contacts`
            : undefined
        }
      />
      <StatTile
        icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
        label="Completed"
        value={stats.total_completed}
      />
      <StatTile
        icon={<XCircle className="h-3.5 w-3.5 text-destructive" />}
        label="Suppressed"
        value={stats.total_suppressed}
      />
    </div>
  );
}
