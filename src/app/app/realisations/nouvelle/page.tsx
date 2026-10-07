import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../ModulePlaceholder";
import { ProjectForm } from "../ProjectForm";

export const metadata: Metadata = { title: "Nouvelle réalisation" };

export default function NewProjectPage() {
  return (
    <>
      <PageHeader title="Nouvelle réalisation" />
      <div className="max-w-3xl space-y-4 p-4 sm:p-8">
        <Link href="/app/realisations" className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
          <ArrowLeft className="size-4" /> Réalisations
        </Link>
        <ProjectForm />
      </div>
    </>
  );
}
