import { ShowBase, useShowContext, useGetMany } from "ra-core";
import { EditButton } from "@/components/admin/edit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { Segment } from "../types";
import type { FilterCriteria } from "./SegmentFilterBuilder";
import { SegmentContactCount } from "./SegmentContactCount";
import { SegmentEnrollDialog } from "./SegmentEnrollDialog";
import { useConfigurationContext } from "../root/ConfigurationContext";

const FilterSummary = ({ criteria }: { criteria: FilterCriteria }) => {
  const { companySectors } = useConfigurationContext();

  const { data: companies = [] } = useGetMany<{ id: number; name: string }>(
    "companies",
    { ids: criteria.company_ids ?? [] },
    { enabled: (criteria.company_ids?.length ?? 0) > 0 },
  );

  const parts: { key: string; label: string }[] = [];

  if (criteria.status)
    parts.push({ key: "status", label: `Status: ${criteria.status}` });

  if ((criteria.tags?.length ?? 0) > 0)
    parts.push({
      key: "tags",
      label: `${criteria.tags!.length} tag${criteria.tags!.length !== 1 ? "s" : ""}`,
    });

  companies.forEach((c) =>
    parts.push({ key: `company-${c.id}`, label: c.name }),
  );

  (criteria.company_sectors ?? []).forEach((s) => {
    const sector = companySectors.find((cs) => cs.value === s);
    parts.push({ key: `sector-${s}`, label: sector?.label ?? s });
  });

  if (criteria.has_linkedin === true)
    parts.push({ key: "linkedin-yes", label: "Has LinkedIn" });
  if (criteria.has_linkedin === false)
    parts.push({ key: "linkedin-no", label: "No LinkedIn" });

  if (!parts.length)
    return (
      <p className="text-sm text-muted-foreground">
        No filters — matches all contacts.
      </p>
    );

  return (
    <div className="flex flex-wrap gap-2">
      {parts.map((p) => (
        <Badge key={p.key} variant="secondary">
          {p.label}
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
