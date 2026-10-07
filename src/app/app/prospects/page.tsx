import type { Metadata } from "next";
import { ModulePlaceholder } from "../ModulePlaceholder";

export const metadata: Metadata = { title: "Prospects" };

export default function ProspectsPage() {
  return <ModulePlaceholder title="Prospects" description="Contacts, demandes entrantes et pipeline commercial" phase="la phase 3" />;
}