import { CreateBase, useGetIdentity } from "ra-core";
import { useFormContext } from "react-hook-form";
import { Form } from "@/components/admin/form";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";
import { TextInput } from "@/components/admin/text-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { SegmentFilterBuilder, type FilterCriteria } from "./SegmentFilterBuilder";
import { SegmentContactCount } from "./SegmentContactCount";

const SegmentFormBody = () => {
  const { setValue, watch } = useFormContext();
  const raw = watch("filter_criteria");
  const criteria: FilterCriteria =
    raw && typeof raw === "object" ? (raw as FilterCriteria) : {};

  return (
    <div className="space-y-6">
      <TextInput source="name" label="Segment name" required />
      <TextInput source="description" label="Description" multiline />

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SegmentFilterBuilder
            value={criteria}
            onChange={(c) => setValue("filter_criteria", c)}
          />
          <SegmentContactCount criteria={criteria} />
        </CardContent>
      </Card>

      <FormToolbar>
        <SaveButton />
      </FormToolbar>
    </div>
  );
};

export const SegmentCreate = () => {
  const { identity } = useGetIdentity();

  return (
    <CreateBase
      redirect="show"
      transform={(data: Record<string, unknown>) => ({
        ...data,
        filter_criteria: data.filter_criteria ?? {},
        created_by: identity?.id ?? null,
      })}
    >
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">New Segment</h1>
        <Form defaultValues={{ filter_criteria: {} }}>
          <SegmentFormBody />
        </Form>
      </div>
    </CreateBase>
  );
};
