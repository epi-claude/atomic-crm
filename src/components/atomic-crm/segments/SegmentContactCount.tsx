// Calls count_segment_contacts() RPC and shows the result.
// Debounced 400ms so it doesn't fire on every keystroke.

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { supabase } from "../providers/supabase/supabase";
import type { FilterCriteria } from "./SegmentFilterBuilder";

interface SegmentContactCountProps {
  criteria: FilterCriteria;
}

export function SegmentContactCount({ criteria }: SegmentContactCountProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc("count_segment_contacts", {
        criteria,
      });
      if (!error && typeof data === "number") {
        setCount(data);
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [JSON.stringify(criteria)]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Users className="h-4 w-4" />
      {loading ? (
        <span>Counting…</span>
      ) : count === null ? (
        <span>—</span>
      ) : (
        <span>
          <strong className="text-foreground">{count}</strong> contact
          {count !== 1 ? "s" : ""} match
        </span>
      )}
    </div>
  );
}
