import type { Metadata } from "next";
import { ModulePlaceholder } from "../ModulePlaceholder";

export const metadata: Metadata = { title: "Agents IA" };

export default function AgentsPage() {
  return <ModulePlaceholder title="Agents IA" description="Propositions des agents à valider avant envoi" phase="la phase 4" />;
}