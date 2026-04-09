import { RecordContextProvider, useListContext } from "ra-core";
import { List } from "@/components/admin/list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Plus } from "lucide-react";

import type { Segment } from "../types";
import type { FilterCriteria } from "./SegmentFilterBuilder";
import { SegmentContactCount } from "./SegmentContactCount";

const filterLabel = (criteria: FilterCriteria): string => {
  const parts: string[] = [];
  if (criteria.status) parts.push(criteria.status);
  if ((criteria.tags?.length ?? 0) > 0)
    parts.push(`${criteria.tags!.length} tag${criteria.tags!.length !== 1 ? "s" : ""}`);
  if (criteria.has_linkedin === true) parts.push("has LinkedIn");
  if (criteria.has_linkedin === false) parts.push("no LinkedIn");
  return parts.join(" · ") || "All contacts";
};

const SegmentListActions = () => (
  <Button asChild size="sm">
    <Link to="/segments/create">
      <Plus className="h-4 w-4 mr-1" />
      New Segment
    </Link>
  </Button>
);

const SegmentGrid = () => {
  const { data, isPending } = useListContext<Segment>();
  if (isPending) return null;

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
        <p className="text-base">No segments yet.</p>
        <Button asChild size="sm">
          <Link to="/segments/create">Create your first segment</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {data.map((segment) => {
        const criteria = (segment.filter_criteria ?? {}) as FilterCriteria;
        return (
          <RecordContextProvider key={segment.id} value={segment}>
            <Link
              to={`/segments/${segment.id}/show`}
              className="no-underline"
            >
              <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <p className="font-semibold text-sm mb-1">{segment.name}</p>
                {segment.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {segment.description}
                  </p>
                )}
                <Badge variant="outline" className="text-xs mb-3">
                  {filterLabel(criteria)}
                </Badge>
                <div className="mt-1">
                  <SegmentContactCount criteria={criteria} />
                </div>
              </div>
            </Link>
          </RecordContextProvider>
        );
      })}
    </div>
  );
};

export const SegmentList = () => (
  <List title="Segments" actions={<SegmentListActions />} perPage={50}>
    <SegmentGrid />
  </List>
);
