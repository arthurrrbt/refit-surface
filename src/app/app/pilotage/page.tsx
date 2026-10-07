import type { Metadata } from "next";
import { ModulePlaceholder } from "../ModulePlaceholder";

export const metadata: Metadata = { title: "Pilotage" };

export default function PilotagePage() {
  return <ModulePlaceholder title="Pilotage" description="CA, marge matière, jours de pose, conversion" phase="la phase 4" />;
}