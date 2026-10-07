import type { Metadata } from "next";
import { ModulePlaceholder } from "../ModulePlaceholder";

export const metadata: Metadata = { title: "Devis" };

export default function DevisPage() {
  return <ModulePlaceholder title="Devis" description="Chiffrage, devis PDF et signature sur mobile" phase="la phase 3" />;
}