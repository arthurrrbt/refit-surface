import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { getProject } from "@/lib/gallery";
import Loading from "../../loading";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { PageHeader } from "../../ModulePlaceholder";
import { deleteProject } from "../actions";
import { ProjectForm } from "../ProjectForm";

export const metadata: Metadata = { title: "Réalisation" };

export default function EditProjectPage({ params }: PageProps<"/app/realisations/[id]">) {
  return (
    <>
      <PageHeader title="Réalisation" />
      <Suspense fallback={<Loading />}>
        <EditProject params={params} />
      </Suspense>
    </>
  );
}

async function EditProject({ params }: { params: PageProps<"/app/realisations/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="max-w-3xl space-y-4 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/app/realisations" className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
          <ArrowLeft className="size-4" /> Réalisations
        </Link>
        {project.published && (
          <Link href="/realisations" target="_blank" className="inline-flex items-center gap-1 text-sm text-accent-strong underline">
            Voir sur le site <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>
      <ProjectForm project={project} />
      <form action={deleteProject} className="flex justify-end">
        <input type="hidden" name="id" value={project.id} />
        <ConfirmSubmit message="Supprimer définitivement cette réalisation et ses photos ?">
          <Trash2 className="size-4" /> Supprimer cette réalisation
        </ConfirmSubmit>
      </form>
    </div>
  );
}
