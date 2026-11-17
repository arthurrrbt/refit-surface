// Sauvegarde complète du projet dans un seul fichier « bundle » git, rangé dans un dossier synchronisé (iCloud).
//
//   npm run sauvegarde                     → dossier par défaut : %USERPROFILE%\iCloudDrive\REFIT\sauvegardes
//   SAUVEGARDE_DIR=D:\autre npm run sauvegarde
//
// Le fichier contient tout l'historique et toutes les branches, plus le travail en cours non enregistré
// (branche « sauvegarde/en-cours »), mais SANS les photos, vidéos et fichiers 3D : ils sont retirés de toutes
// les versions (≈ 1 Mo au lieu de ≈ 40 Mo). Il ne contient jamais non plus ce que .gitignore exclut :
// secrets (.env*), node_modules, compilation. Restauration : voir LISEZ-MOI.txt à côté des sauvegardes.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const KEEP = 30; // nombre de sauvegardes conservées (les plus anciennes sont supprimées)
// Médias exclus de la sauvegarde, dans toutes les versions (motifs « pathspec » de git)
const EXCLUDED = [
  ":(exclude)public/3d",
  ...["mp4", "mov", "webm", "jpg", "jpeg", "png", "webp", "avif", "gif", "heic", "hdr"].map((ext) => `:(exclude,glob)**/*.${ext}`),
];
const NAME = "refit-surface";
const WIP_REF = "refs/heads/sauvegarde/en-cours";

const dir = process.env.SAUVEGARDE_DIR || join(process.env.USERPROFILE || process.env.HOME || ".", "iCloudDrive", "REFIT", "sauvegardes");
const git = (args, env) => execFileSync("git", args, { encoding: "utf8", env: { ...process.env, ...env } }).trim();

// 1. Travail en cours : instantané de tous les fichiers suivis ou nouveaux (hors .gitignore), dans un index
//    temporaire. Le dossier de travail et l'index réel ne sont pas touchés.
const tmpIndex = join(tmpdir(), `refit-sauvegarde-${process.pid}.index`);
try {
  const env = { GIT_INDEX_FILE: tmpIndex };
  git(["read-tree", "HEAD"], env);
  git(["-c", "core.safecrlf=false", "add", "-A"], env);
  const tree = git(["write-tree"], env);
  const head = git(["rev-parse", "HEAD"]);
  const previous = git(["for-each-ref", "--format=%(objectname) %(tree) %(parent)", WIP_REF]);
  if (tree !== git(["rev-parse", "HEAD^{tree}"])) {
    // Même contenu et même point de départ que l'instantané existant : on le garde tel quel (sinon la date
    // dans le message changerait l'identifiant et déclencherait une sauvegarde inutile).
    if (previous.split(" ")[1] !== tree || previous.split(" ")[2] !== head) {
      const commit = git(["commit-tree", tree, "-p", "HEAD", "-m", `Travail en cours au ${new Date().toLocaleString("fr-FR")}`]);
      git(["update-ref", WIP_REF, commit]);
    }
  } else if (previous) {
    git(["update-ref", "-d", WIP_REF]); // plus rien en cours : on retire l'ancien instantané
  }
} finally {
  rmSync(tmpIndex, { force: true });
}

// 1 bis. Versions nommées (étiquettes git V2, V3…) : chacune est enregistrée une fois pour toutes en archive .zip
//        COMPLÈTE (photos et vidéos comprises), ouvrable sans aucun outil, dans le sous-dossier « versions ».
//        Nommer une nouvelle version : git tag -a V4 -m "description", puis npm run sauvegarde.
const versionsDir = join(dir, "versions");
mkdirSync(versionsDir, { recursive: true });
const existing = readdirSync(versionsDir);
for (const tag of git(["tag", "-l", "V*"]).split("\n").filter(Boolean)) {
  const prefix = `${NAME}_${tag}_`;
  if (existing.some((f) => f.startsWith(prefix))) continue; // déjà enregistrée
  const date = git(["log", "-1", "--format=%ad", "--date=format:%Y-%m-%d", tag]);
  const zip = join(versionsDir, `${prefix}${date}.zip`);
  git(["archive", "--format=zip", `--prefix=${NAME}_${tag}/`, "-o", zip, tag]);
  console.log(`Version ${tag} enregistrée : ${zip} (${(statSync(zip).size / 1024 / 1024).toFixed(1)} Mo)`);
}

// 2. Rien n'a changé depuis la dernière sauvegarde (mêmes branches, mêmes contenus) : on s'arrête là.
mkdirSync(dir, { recursive: true });
const signature = createHash("sha256").update(git(["for-each-ref", "--format=%(objectname) %(refname)", "refs/heads", "refs/tags"])).digest("hex");
const signatureFile = join(dir, ".derniere-signature");
if (existsSync(signatureFile) && readFileSync(signatureFile, "utf8") === signature) {
  console.log("Aucun changement depuis la dernière sauvegarde.");
  process.exit(0);
}

// 3. Le bundle : toutes les branches et étiquettes, avec leur historique complet. Vérifié avant d'être gardé.
// Heure locale (et non UTC) dans le nom : AAAA-MM-JJ_HHhMM
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}h${pad(now.getMinutes())}`;
const file = join(dir, `${NAME}_${stamp}.bundle`);
// L'historique est recopié dans un dépôt temporaire sans les médias (fast-export limité aux chemins gardés),
// puis empaqueté. Les identifiants des versions y diffèrent de ceux du projet : c'est une copie de secours.
const light = mkdtempSync(join(tmpdir(), "refit-sauvegarde-"));
try {
  execFileSync("git", ["init", "-q", "--bare", light]);
  const stream = execFileSync(
    "git",
    ["fast-export", "--branches", "--tags", "--signed-tags=strip", "--reencode=yes", "--", ".", ...EXCLUDED],
    { maxBuffer: 1024 * 1024 * 1024 },
  );
  execFileSync("git", ["-C", light, "fast-import", "--quiet"], { input: stream });
  const branch = git(["symbolic-ref", "--short", "-q", "HEAD"]) || "main";
  execFileSync("git", ["-C", light, "symbolic-ref", "HEAD", `refs/heads/${branch}`]); // le clone ouvre la branche du moment
  execFileSync("git", ["-C", light, "bundle", "create", file, "--branches", "--tags", "HEAD"], { stdio: "ignore" });
  execFileSync("git", ["-C", light, "bundle", "verify", "-q", file], { stdio: "ignore" });
} finally {
  rmSync(light, { recursive: true, force: true });
}
writeFileSync(signatureFile, signature);

// 4. Rotation : on garde les KEEP plus récentes.
const bundles = readdirSync(dir).filter((f) => f.startsWith(`${NAME}_`) && f.endsWith(".bundle")).sort();
for (const old of bundles.slice(0, Math.max(0, bundles.length - KEEP))) rmSync(join(dir, old));

writeFileSync(
  join(dir, "LISEZ-MOI.txt"),
  `Sauvegardes du projet REFIT Surface (code + historique complet + travail en cours).
Chaque fichier .bundle est une copie autonome du CODE, sans les photos, vidéos et fichiers 3D (pour rester légère).
Les secrets (.env.local) n'y sont jamais : à recopier depuis Vercel ou votre gestionnaire de mots de passe.

Versions nommées (V2, V3…) : dossier « versions », une archive .zip COMPLÈTE par version (photos et vidéos
comprises). Il suffit de la décompresser, puis npm ci et npm run dev pour la relancer.

Récupérer les médias après une restauration : ils sont dans la version publiée sur GitHub
(github.com/arthurrrbt/refit-surface, dossiers public/media, src/assets/media, public/brand, public/icons)
et les originaux dans iCloudDrive\\REFIT\\medias. Recopiez ces dossiers dans le projet restauré.

Restaurer (dans un terminal) :
  git clone "${NAME}_AAAA-MM-JJ_HHhMM.bundle" refit-surface-restaure
  cd refit-surface-restaure
  git branch -a                              (liste les branches sauvegardées)
  git switch sauvegarde/en-cours             (le travail non enregistré au moment de la sauvegarde)
  npm ci                                     (réinstalle les dépendances)

Remettre une ancienne version d'un seul fichier dans le projet actuel :
  git fetch "<chemin du .bundle>" main:restauration
  git restore --source=restauration -- chemin/du/fichier
`,
);

const size = (statSync(file).size / 1024 / 1024).toFixed(1);
console.log(`Sauvegarde créée : ${file} (${size} Mo, ${Math.min(bundles.length, KEEP)} sauvegarde(s) conservée(s)).`);
