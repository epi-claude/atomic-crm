import { EditBase } from "ra-core";
import { useFormContext } from "react-hook-form";
import { Form } from "ra-core";
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

export const SegmentEdit = () => (
  <EditBase redirect="show">
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Segment</h1>
      <Form>
        <SegmentFormBody />
      </Form>
    </div>
  </EditBase>
);
