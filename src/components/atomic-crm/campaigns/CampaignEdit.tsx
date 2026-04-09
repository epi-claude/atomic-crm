import { EditBase } from "ra-core";
import { Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";

const statusChoices = [
  { id: "draft", name: "Draft" },
  { id: "active", name: "Active" },
  { id: "paused", name: "Paused" },
  { id: "archived", name: "Archived" },
];

export const CampaignEdit = () => (
  <EditBase redirect="show">
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Campaign</h1>
      <Form>
        <Card>
          <CardContent className="space-y-4 pt-4">
            <TextInput source="name" label="Name" fullWidth required />
            <TextInput source="slug" label="Slug" fullWidth required />
            <TextInput
              source="description"
              label="Description"
              fullWidth
              multiline
            />
            <SelectInput
              source="status"
              label="Status"
              choices={statusChoices}
            />
            <FormToolbar><SaveButton /></FormToolbar>
          </CardContent>
        </Card>
      </Form>
    </div>
  </EditBase>
);
