import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Eye, EyeOff, ImagePlus, Images } from "lucide-react";
import { listProjects } from "@/lib/gallery";
import { galleryPublicUrl } from "@/lib/gallery-shared";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";
import { UniversBadge } from "../prospects/StatusBadge";

export const metadata: Metadata = { title: "Réalisations" };

export default function RealisationsAdminPage() {
  return (
    <>
      <PageHeader title="Réalisations">Vos chantiers avant / après, publiés sur la galerie du site.</PageHeader>
      <div className="px-4 pt-4 sm:px-8">
        <Link href="/app/realisations/nouvelle" className="inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2.5 text-sm font-semibold text-paper">
          <ImagePlus className="size-4" /> Nouvelle réalisation
        </Link>
      </div>
      <Suspense fallback={<Loading />}>
        <ProjectList />
      </Suspense>
    </>
  );
}

async function ProjectList() {
  const projects = await listProjects();
  if (!projects.length) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex flex-col items-center rounded-sm bg-paper p-10 text-center text-ink/60 shadow-sm">
          <Images className="size-8 text-ink/30" />
          <p className="mt-3">Aucune réalisation pour l&apos;instant.</p>
          <p className="mt-1 text-sm">Ajoutez votre premier avant / après : il apparaîtra dans la galerie du site.</p>
        </div>
      </div>
    );
  }
  return (
    <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">
      {projects.map((p) => (
        <li key={p.id}>
          <Link href={`/app/realisations/${p.id}`} className="block overflow-hidden rounded-sm bg-paper shadow-sm transition-shadow hover:shadow-md">
            <div className="grid aspect-[8/3] grid-cols-2 bg-mist">
              {[p.before_path, p.after_path].map((path, i) =>
                path ? (
                  // eslint-disable-next-line @next/next/no-img-element -- vignette du stockage public
                  <img key={i} src={galleryPublicUrl(path)} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <span key={i} className="flex items-center justify-center text-xs text-ink/40">
                    {i === 0 ? "Avant ?" : "Après ?"}
                  </span>
                ),
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2">
                <UniversBadge univers={p.univers} />
                <span className={`inline-flex items-center gap-1 text-xs ${p.published ? "text-emerald-700" : "text-ink/50"}`}>
                  {p.published ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  {p.published ? "Publiée" : "Brouillon"}
                </span>
              </div>
              <p className="mt-2 font-semibold">{p.title}</p>
              {p.city && <p className="text-sm text-ink/55">{p.city}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
