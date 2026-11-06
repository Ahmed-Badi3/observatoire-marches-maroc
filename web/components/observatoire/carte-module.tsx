import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Petite carte « module » : une icône, un titre, une phrase, et un lien vers la page.
export function CarteModule({
  href,
  titre,
  description,
  icone: Icone,
}: {
  href: string;
  titre: string;
  description: string;
  icone: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-carte bg-carte p-5 shadow-carte transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent-principal"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-page text-accent-fonce">
        <Icone className="size-[18px]" />
      </span>
      <span className="text-sm font-semibold text-texte group-hover:text-accent-fonce">{titre}</span>
      <span className="text-xs leading-relaxed text-texte-secondaire">{description}</span>
    </Link>
  );
}
