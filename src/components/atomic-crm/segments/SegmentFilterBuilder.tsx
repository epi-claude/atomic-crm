// Builds the filter_criteria JSONB object used by segments.
// Renders tag checkboxes, status select, company input, linkedin toggle.
// Calls onChange on every change so parent can show live count preview.

import { useEffect, useState } from "react";
import { useGetList } from "ra-core";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

import type { Tag } from "../types";
import { useConfigurationContext } from "../root/ConfigurationContext";

export interface FilterCriteria {
  tags?: number[];
  status?: string;
  company_id?: number;
  has_linkedin?: boolean;
}

interface SegmentFilterBuilderProps {
  value: FilterCriteria;
  onChange: (criteria: FilterCriteria) => void;
}

export function SegmentFilterBuilder({
  value,
  onChange,
}: SegmentFilterBuilderProps) {
  const { noteStatuses } = useConfigurationContext();
  const { data: tags = [] } = useGetList<Tag>("tags", {
    sort: { field: "name", order: "ASC" },
    pagination: { page: 1, perPage: 100 },
  });

  const [local, setLocal] = useState<FilterCriteria>(value);

  // Propagate changes up
  useEffect(() => {
    onChange(local);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTag = (tagId: number) => {
    setLocal((prev) => {
      const current = prev.tags ?? [];
      const next = current.includes(tagId)
        ? current.filter((t) => t !== tagId)
        : [...current, tagId];
      return { ...prev, tags: next.length ? next : undefined };
    });
  };

  const setStatus = (status: string) => {
    setLocal((prev) => ({
      ...prev,
      status: status === "__all__" ? undefined : status,
    }));
  };

  const setLinkedin = (val: boolean | undefined) => {
    setLocal((prev) => ({ ...prev, has_linkedin: val }));
  };

  const clearAll = () => setLocal({});

  const hasFilters =
    (local.tags?.length ?? 0) > 0 ||
    !!local.status ||
    local.has_linkedin !== undefined;

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={local.status ?? "__all__"} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Any status</SelectItem>
            {noteStatuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-1.5">
          <Label>Tags (must have ALL selected)</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = (local.tags ?? []).includes(Number(tag.id));
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(Number(tag.id))}
                  className="focus:outline-none"
                >
                  <Badge
                    style={
                      active
                        ? { backgroundColor: tag.color, color: "#fff" }
                        : { borderColor: tag.color, color: tag.color }
                    }
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer text-xs transition-all"
                  >
                    {tag.name}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* LinkedIn */}
      <div className="space-y-2">
        <Label>LinkedIn profile</Label>
        <div className="flex gap-4">
          {(
            [
              { label: "Any", val: undefined },
              { label: "Has LinkedIn", val: true },
              { label: "No LinkedIn", val: false },
            ] as { label: string; val: boolean | undefined }[]
          ).map(({ label, val }) => {
            const active =
              val === undefined
                ? local.has_linkedin === undefined
                : local.has_linkedin === val;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setLinkedin(val)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-muted-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
