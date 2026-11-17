// Appelé par le hook git .githooks/pre-push : chaque publication du site (envoi de « main » sur GitHub,
// qui déclenche le déploiement) devient une version nommée V<n>, enregistrée dans iCloud par la sauvegarde.
//
// Git transmet sur l'entrée standard une ligne par branche envoyée :
//   <ref locale> <commit local> <ref distante> <commit distant>
// VERSION_DRY_RUN=1 : affiche ce qui serait fait, sans rien créer (pour tester).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PUBLISHED_BRANCH = "refs/heads/main";
const DELETED = /^0+$/; // envoi qui supprime la branche distante
const dryRun = process.env.VERSION_DRY_RUN === "1";
const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

const pushed = readFileSync(0, "utf8")
  .split("\n")
  .map((line) => line.trim().split(/\s+/))
  .filter(([, localSha, remoteRef]) => remoteRef === PUBLISHED_BRANCH && localSha && !DELETED.test(localSha));

if (pushed.length === 0) process.exit(0); // pas une publication du site : rien à faire

const [, sha] = pushed[0];
const already = git(["tag", "--points-at", sha, "-l", "V*"]);
if (already) {
  console.log(`Publication : cette version est déjà nommée ${already.split("\n").join(", ")}.`);
} else {
  const numbers = git(["tag", "-l", "V*"]).split("\n").map((t) => Number(t.slice(1))).filter(Number.isInteger);
  const tag = `V${Math.max(1, ...numbers) + 1}`;
  const subject = git(["log", "-1", "--format=%s", sha]);
  const date = new Date().toLocaleDateString("fr-FR");
  const message = `${tag} — ${subject} (publiée le ${date})`;
  if (dryRun) {
    console.log(`[essai] Créerait l'étiquette ${tag} sur ${sha.slice(0, 7)} : « ${message} »`);
    process.exit(0);
  }
  git(["tag", "-a", tag, sha, "-m", message]);
  console.log(`Publication : version ${tag} créée (${subject}).`);
}

if (!dryRun) {
  // La sauvegarde enregistre l'archive complète de la nouvelle version (dossier « versions ») et la sauvegarde courante
  execFileSync("node", ["scripts/sauvegarde.mjs"], { stdio: "inherit" });
}
