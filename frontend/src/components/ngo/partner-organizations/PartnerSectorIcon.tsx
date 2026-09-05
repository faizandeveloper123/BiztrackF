import {
  GraduationCap,
  HeartHandshake,
  Stethoscope,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import type { PartnerSector } from "@/src/models/ngo";
import { cn } from "@/src/lib/utils";

type PartnerSectorIconProps = {
  sector: PartnerSector | string;
  className?: string;
};

export function PartnerSectorIcon({
  sector,
  className,
}: PartnerSectorIconProps) {
  const iconClass = cn("h-5 w-5", className);
  switch (sector) {
    case "relief":
      return <Truck className={iconClass} />;
    case "medical":
      return <Stethoscope className={iconClass} />;
    case "education":
      return <GraduationCap className={iconClass} />;
    case "food":
      return <UtensilsCrossed className={iconClass} />;
    default:
      return <HeartHandshake className={iconClass} />;
  }
}
