"use client";

import { useRef, useState } from "react";
import { Check, Download, Eraser, Loader2 } from "lucide-react";
import { signQuote } from "./actions";

/** Zone de signature au doigt / à la souris + mention « Bon pour accord ». */
export function SignaturePad({ token, defaultName }: { token: string; defaultName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * canvas.width, y: ((e.clientY - rect.top) / rect.height) * canvas.height };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId); // garde le tracé même si le doigt sort du cadre
    } catch {
      // Navigateur sans capture : le tracé fonctionne quand même dans le cadre
    }
    drawing.current = true;
    const { x, y } = point(e);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0d0e0f";
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  }

  async function submit(formData: FormData) {
    if (!hasInk || !canvasRef.current) return setError("Tracez votre signature dans le cadre.");
    setSending(true);
    setError(null);
    const result = await signQuote({
      token,
      name: String(formData.get("name") ?? ""),
      consent: (formData.get("consent") === "on") as true,
      signature: canvasRef.current.toDataURL("image/png"),
    });
    setSending(false);
    if (!result.ok) return setError(result.error);
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check className="size-6" />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold">Merci, votre devis est signé</h2>
        <p className="mt-2 text-sm text-ink/70">Nous vous recontactons très vite pour planifier l&apos;intervention.</p>
        <a href={`/signature/${token}/pdf`} className="mt-5 inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2.5 text-sm font-semibold text-paper">
          <Download className="size-4" /> Télécharger le devis signé
        </a>
      </div>
    );
  }

  return (
    <form action={submit} className="space-y-4">
      <label className="block text-sm font-semibold">
        Nom et prénom du signataire
        <input
          name="name"
          required
          defaultValue={defaultName}
          autoComplete="name"
          className="mt-1 block w-full rounded-sm border border-ink/20 bg-white px-3 py-2.5 focus:border-accent focus:outline-none"
        />
      </label>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Signature</span>
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-ink">
            <Eraser className="size-3.5" /> Effacer
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={600}
          height={220}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
          aria-label="Zone de signature : tracez votre signature au doigt ou à la souris"
          className="mt-1 h-44 w-full touch-none rounded-sm border-2 border-dashed border-ink/25 bg-white"
        />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 size-4 accent-accent" />
        <span>
          J&apos;ai lu le devis et je l&apos;accepte — <strong>Bon pour accord</strong>.
        </span>
      </label>
      {error && <p className="rounded-sm bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-ink px-5 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.15em] text-paper disabled:opacity-60"
      >
        {sending && <Loader2 className="size-4 animate-spin" />}
        {sending ? "Signature en cours…" : "Signer le devis"}
      </button>
      <p className="text-xs text-ink/50">
        En signant, vous acceptez le devis ci-dessus. Votre signature est horodatée et associée à l&apos;empreinte numérique du
        document ; un certificat est joint au devis signé.
      </p>
    </form>
  );
}
