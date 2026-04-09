// Builds the filter_criteria JSONB object used by segments.
// Renders tag checkboxes, status select, multi-company combobox,
// multi-sector pills, and linkedin toggle.
// Calls onChange on every change so parent can show live count preview.

import { useEffect, useRef, useState } from "react";
import { useGetList } from "ra-core";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, ChevronsUpDown, Check, Building2 } from "lucide-react";

import type { Tag } from "../types";
import { useConfigurationContext } from "../root/ConfigurationContext";

export interface FilterCriteria {
  tags?: number[];
  status?: string;
  company_ids?: number[];
  company_sectors?: string[];
  has_linkedin?: boolean;
}

interface SegmentFilterBuilderProps {
  value: FilterCriteria;
  onChange: (criteria: FilterCriteria) => void;
}

interface Company {
  id: number;
  name: string;
}

// Searchable multi-select combobox for companies
function CompanyMultiSelect({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: companies = [] } = useGetList<Company>("companies", {
    sort: { field: "name", order: "ASC" },
    pagination: { page: 1, perPage: 100 },
    filter: query ? { name: query } : {},
  });

  const selectedCompanies = companies.filter((c) =>
    selected.includes(Number(c.id)),
  );

  const toggle = (id: number) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  const remove = (id: number) => onChange(selected.filter((s) => s !== id));

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="space-y-2">
      {/* Selected badges */}
      {selectedCompanies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCompanies.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
              <Building2 className="h-3 w-3" />
              {c.name}
              <button
                type="button"
                onClick={() => remove(Number(c.id))}
                className="ml-0.5 rounded hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input + dropdown */}
      <div className="relative">
        <div
          className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm cursor-text"
          onClick={() => setOpen(true)}
        >
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search companies…"
            className="h-auto border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
          />
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <div className="max-h-52 overflow-y-auto p-1">
              {companies.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No companies found.
                </p>
              ) : (
                companies.map((company) => {
                  const active = selected.includes(Number(company.id));
                  return (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => {
                        toggle(Number(company.id));
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent text-left"
                    >
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 ${active ? "opacity-100" : "opacity-0"}`}
                      />
                      {company.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SegmentFilterBuilder({
  value,
  onChange,
}: SegmentFilterBuilderProps) {
  const { noteStatuses, companySectors } = useConfigurationContext();
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

  const setCompanyIds = (ids: number[]) => {
    setLocal((prev) => ({
      ...prev,
      company_ids: ids.length ? ids : undefined,
    }));
  };

  const toggleSector = (sector: string) => {
    setLocal((prev) => {
      const current = prev.company_sectors ?? [];
      const next = current.includes(sector)
        ? current.filter((s) => s !== sector)
        : [...current, sector];
      return { ...prev, company_sectors: next.length ? next : undefined };
    });
  };

  const setLinkedin = (val: boolean | undefined) => {
    setLocal((prev) => ({ ...prev, has_linkedin: val }));
  };

  const clearAll = () => setLocal({});

  const hasFilters =
    (local.tags?.length ?? 0) > 0 ||
    !!local.status ||
    (local.company_ids?.length ?? 0) > 0 ||
    (local.company_sectors?.length ?? 0) > 0 ||
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

      {/* Companies */}
      <div className="space-y-1.5">
        <Label>Companies (any match)</Label>
        <CompanyMultiSelect
          selected={local.company_ids ?? []}
          onChange={setCompanyIds}
        />
      </div>

      {/* Sectors */}
      <div className="space-y-1.5">
        <Label>Industry / sector (any match)</Label>
        <div className="flex flex-wrap gap-2">
          {companySectors.map(({ value: sectorValue, label }) => {
            const active = (local.company_sectors ?? []).includes(sectorValue);
            return (
              <button
                key={sectorValue}
                type="button"
                onClick={() => toggleSector(sectorValue)}
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
