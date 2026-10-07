// Limite de Suspense propre à chaque page du back-office (lecture de session par page).
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-7 w-48 rounded bg-ink/10" />
      <div className="h-32 rounded bg-ink/5" />
    </div>
  );
}
