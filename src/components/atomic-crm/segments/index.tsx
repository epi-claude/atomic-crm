import { Filter } from "lucide-react";

import { SegmentList } from "./SegmentList";
import { SegmentShow } from "./SegmentShow";
import { SegmentCreate } from "./SegmentCreate";
import { SegmentEdit } from "./SegmentEdit";

export default {
  list: SegmentList,
  show: SegmentShow,
  create: SegmentCreate,
  edit: SegmentEdit,
  icon: Filter,
  recordRepresentation: (record: { name: string }) => record.name,
};
