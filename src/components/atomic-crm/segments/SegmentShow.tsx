import { ShowBase, useShowContext } from "ra-core";
import { EditButton } from "@/components/admin/edit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { Segment } from "../types";
import type { FilterCriteria } from "./SegmentFilterBuilder";
import { SegmentContactCount } from "./SegmentContactCount";
import { SegmentEnrollDialog } from "./SegmentEnrollDialog";

const FilterSummary = ({
  criteria,
}: {
  criteria: FilterCriteria;
}) => {
  const parts: string[] = [];
  if (criteria.status) parts.push(`Status: ${criteria.status}`);
  if ((criteria.tags?.length ?? 0) > 0)
    parts.push(`${criteria.tags!.length} tag${criteria.tags!.length !== 1 ? "s" : ""}`);
  if (criteria.has_linkedin === true) parts.push("Has LinkedIn");
  if (criteria.has_linkedin === false) parts.push("No LinkedIn");
  if (criteria.company_id) parts.push(`Company #${criteria.company_id}`);

  if (!parts.length) return <p className="text-sm text-muted-foreground">No filters — matches all contacts.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {parts.map((p) => (
        <Badge key={p} variant="secondary">
          {p}
        </Badge>
      ))}
    </div>
  );
};

const SegmentShowContent = () => {
  const { record, isPending } = useShowContext<Segment>();
  if (isPending || !record) return null;

  const criteria = (record.filter_criteria ?? {}) as FilterCriteria;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{record.name}</h1>
          {record.description && (
            <p className="text-muted-foreground mt-1">{record.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EditButton label="Edit" />
          <SegmentEnrollDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-normal">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterSummary criteria={criteria} />
          <SegmentContactCount criteria={criteria} />
        </CardContent>
      </Card>
    </div>
  );
};

export const SegmentShow = () => (
  <ShowBase>
    <SegmentShowContent />
  </ShowBase>
);
