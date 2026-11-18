// Agent Médias : prépare pour le site les photos et vidéos déposées dans la boîte de dépôt.
//
//   npm run -s agent:medias                 → traite tout ce qui est dans la boîte de dépôt
//   npm run -s agent:medias -- --essai      → liste seulement ce qui serait traité
//
// Boîte de dépôt : iCloudDrive\REFIT\medias\a-integrer\  (vous y déposez ce que vous téléchargez de TEGO)
// Résultat       : iCloudDrive\REFIT\agents\medias\AAAA-MM-JJ\  (versions web + planche de contrôle)
// Les originaux traités sont rangés dans a-integrer\traites\AAAA-MM-JJ\ (rien n'est supprimé).
// Mêmes réglages que les médias déjà en ligne : photos 1600 px JPEG, vidéos 720p ×2 sans son + affiche.
// Rien n'est intégré au code ni publié ici : c'est une préparation, à valider.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join, parse } from "node:path";
import sharp from "sharp";

const home = process.env.USERPROFILE || process.env.HOME;
const REFIT = join(home, "iCloudDrive", "REFIT");
const INBOX = join(REFIT, "medias", "a-integrer");
const FFMPEG = process.env.FFMPEG_PATH || createRequire("C:/dev/outils/")("ffmpeg-static");
const IMAGES = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".avif"]);
const VIDEOS = new Set([".mp4", ".mov", ".m4v", ".webm"]);
const dryRun = process.argv.includes("--essai");

const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const slug = (name) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "media";

mkdirSync(INBOX, { recursive: true });
const files = readdirSync(INBOX).filter((f) => {
  const ext = extname(f).toLowerCase();
  return statSync(join(INBOX, f)).isFile() && (IMAGES.has(ext) || VIDEOS.has(ext));
});
if (files.length === 0) {
  console.log(JSON.stringify({ nouveaux: 0, message: "Boîte de dépôt vide : rien à préparer." }));
  process.exit(0);
}
if (dryRun) {
  console.log(JSON.stringify({ nouveaux: files.length, fichiers: files }, null, 2));
  process.exit(0);
}

const out = join(REFIT, "agents", "medias", day);
const done = join(INBOX, "traites", day);
mkdirSync(out, { recursive: true });
mkdirSync(done, { recursive: true });

const results = [];
for (const file of files) {
  const src = join(INBOX, file);
  const ext = extname(file).toLowerCase();
  const name = slug(parse(file).name);
  try {
    if (IMAGES.has(ext)) {
      const target = join(out, `${name}.jpg`);
      const meta = await sharp(src).metadata();
      const info = await sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true }).flatten({ background: "#ffffff" })
        .jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(target);
      results.push({ type: "photo", original: file, fichier: target, original_px: `${meta.width}x${meta.height}`, web_px: `${info.width}x${info.height}`, ko: Math.round(info.size / 1024) });
    } else {
      const target = join(out, `${name}.mp4`);
      const poster = join(out, `${name}.jpg`);
      const probe = (() => { try { execFileSync(FFMPEG, ["-i", src], { stdio: "pipe" }); return ""; } catch (e) { return String(e.stderr); } })();
      const [w, h] = (probe.match(/Video:.*?(\d{3,4})x(\d{3,4})/) || []).slice(1).map(Number);
      const scale = w && h && w > h ? "scale=1280:-2" : "scale=720:-2"; // paysage 1280 px, vertical 720 px de large
      execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-i", src, "-an", "-vf", `setpts=PTS/2,fps=25,${scale}:flags=lanczos,format=yuv420p`,
        "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-profile:v", "high", "-movflags", "+faststart", target]);
      execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-ss", "3", "-i", target, "-frames:v", "1", "-q:v", "4", poster]);
      results.push({ type: "video", original: file, fichier: target, affiche: poster, original_px: w ? `${w}x${h}` : "?", mo: +(statSync(target).size / 1048576).toFixed(1) });
    }
    renameSync(src, join(done, file)); // l'original est rangé, jamais supprimé
  } catch (error) {
    results.push({ original: file, erreur: String(error.message || error).slice(0, 300) });
  }
}

// Planche de contrôle : toutes les photos et affiches de vidéos, pour vérifier d'un coup d'œil
const thumbs = results.filter((r) => !r.erreur).map((r) => r.affiche || r.fichier).filter((f) => existsSync(f));
let planche = null;
if (thumbs.length) {
  const cols = Math.min(5, thumbs.length), rows = Math.ceil(thumbs.length / cols);
  const tiles = await Promise.all(thumbs.map(async (f, i) => ({
    input: await sharp(f).resize(320, 320, { fit: "contain", background: "#222" }).toBuffer(), left: (i % cols) * 330, top: Math.floor(i / cols) * 330,
  })));
  planche = join(out, "_planche.jpg");
  await sharp({ create: { width: cols * 330, height: rows * 330, channels: 3, background: "#fff" } }).composite(tiles).jpeg({ quality: 75 }).toFile(planche);
}

console.log(JSON.stringify({ nouveaux: files.length, dossier: out, planche, originaux_ranges_dans: done, resultats: results }, null, 2));
