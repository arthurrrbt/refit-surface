import type { Metadata } from "next";
import { ModulePlaceholder } from "../ModulePlaceholder";

export const metadata: Metadata = { title: "Factures" };

export default function FacturesPage() {
  return <ModulePlaceholder title="Factures" description="Factures et transmission à la plateforme agréée" phase="la phase 3" />;
}