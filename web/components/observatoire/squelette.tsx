import { cn } from "@/lib/utils";

// Blocs gris animés pendant le chargement. L'animation s'arrête si l'utilisateur
// a demandé moins de mouvement (règle globale dans globals.css).
export function Squelette({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-separateur/60", className)} aria-hidden="true" />;
}

// Une carte KPI en chargement.
export function SqueletteCarteKpi() {
  return (
    <div
      className="flex flex-col gap-3 rounded-carte bg-carte p-6 shadow-carte"
      role="status"
      aria-label="Chargement"
    >
      <Squelette className="h-4 w-1/2" />
      <Squelette className="h-9 w-2/3" />
      <Squelette className="h-5 w-1/4" />
      <Squelette className="h-10 w-full" />
    </div>
  );
}

// Un graphique ou un tableau en chargement.
export function SqueletteBloc({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-carte bg-carte p-6 shadow-carte", className)}
      role="status"
      aria-label="Chargement"
    >
      <Squelette className="mb-4 h-5 w-1/3" />
      <Squelette className="h-48 w-full" />
    </div>
  );
}
