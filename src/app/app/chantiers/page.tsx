import type { Metadata } from "next";
import { ModulePlaceholder } from "../ModulePlaceholder";

export const metadata: Metadata = { title: "Chantiers" };

export default function ChantiersPage() {
  return <ModulePlaceholder title="Chantiers" description="Suivi des chantiers, matériel et photos" phase="la phase 3" />;
}