import { Bot, CalendarDays, ChartLine, FileText, HardHat, Images, LayoutDashboard, Receipt, Users } from "lucide-react";

export const modules = [
  { href: "/app", label: "Accueil", icon: LayoutDashboard, mobile: true },
  { href: "/app/prospects", label: "Prospects", icon: Users, mobile: true, description: "Contacts, demandes entrantes et pipeline commercial" },
  { href: "/app/devis", label: "Devis", icon: FileText, mobile: true, description: "Chiffrage, devis PDF et signature sur mobile" },
  { href: "/app/factures", label: "Factures", icon: Receipt, mobile: false, description: "Factures et transmission à la plateforme agréée" },
  { href: "/app/planning", label: "Planning", icon: CalendarDays, mobile: true, description: "Visites, métrages et poses, synchronisés avec Outlook" },
  { href: "/app/chantiers", label: "Chantiers", icon: HardHat, mobile: false, description: "Suivi des chantiers, matériel et photos" },
  { href: "/app/realisations", label: "Réalisations", icon: Images, mobile: false, description: "Avant / après publiés dans la galerie du site" },
  { href: "/app/pilotage", label: "Pilotage", icon: ChartLine, mobile: true, description: "CA, marge matière, jours de pose, conversion" },
  { href: "/app/agents", label: "Agents IA", icon: Bot, mobile: false, description: "Propositions des agents à valider" },
] as const;

export type ModuleHref = (typeof modules)[number]["href"];
