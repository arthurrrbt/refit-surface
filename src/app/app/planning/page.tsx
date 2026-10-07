import type { Metadata } from "next";
import { ModulePlaceholder } from "../ModulePlaceholder";

export const metadata: Metadata = { title: "Planning" };

export default function PlanningPage() {
  return <ModulePlaceholder title="Planning" description="Visites, métrages et poses, synchronisés avec Outlook" phase="la phase 3" />;
}