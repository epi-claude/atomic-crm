import { Mail } from "lucide-react";

import { CampaignList } from "./CampaignList";
import { CampaignShow } from "./CampaignShow";
import { CampaignCreate } from "./CampaignCreate";
import { CampaignEdit } from "./CampaignEdit";

export default {
  list: CampaignList,
  show: CampaignShow,
  create: CampaignCreate,
  edit: CampaignEdit,
  icon: Mail,
  recordRepresentation: (record: { name: string }) => record.name,
};
