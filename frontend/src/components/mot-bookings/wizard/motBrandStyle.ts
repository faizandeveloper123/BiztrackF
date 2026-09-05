export type VehicleBrandStyle = {
  label: string;
  initials: string;
  gradient: string;
  accent: string;
};

const BRAND_MAP: Record<string, VehicleBrandStyle> = {
  "land rover": {
    label: "Land Rover",
    initials: "LR",
    gradient: "from-emerald-700 via-green-800 to-emerald-950",
    accent: "#005a2b",
  },
  jaguar: {
    label: "Jaguar",
    initials: "JAG",
    gradient: "from-slate-800 via-zinc-900 to-black",
    accent: "#9e1b32",
  },
  bmw: {
    label: "BMW",
    initials: "BMW",
    gradient: "from-sky-700 via-blue-800 to-indigo-900",
    accent: "#0066b1",
  },
  mercedes: {
    label: "Mercedes-Benz",
    initials: "MB",
    gradient: "from-zinc-700 via-slate-800 to-black",
    accent: "#00a19c",
  },
  "mercedes-benz": {
    label: "Mercedes-Benz",
    initials: "MB",
    gradient: "from-zinc-700 via-slate-800 to-black",
    accent: "#00a19c",
  },
  audi: {
    label: "Audi",
    initials: "AUDI",
    gradient: "from-gray-700 via-slate-800 to-gray-900",
    accent: "#bb0a30",
  },
  ford: {
    label: "Ford",
    initials: "F",
    gradient: "from-blue-700 via-blue-800 to-indigo-900",
    accent: "#003478",
  },
  toyota: {
    label: "Toyota",
    initials: "T",
    gradient: "from-red-600 via-rose-700 to-red-900",
    accent: "#eb0a1e",
  },
  volkswagen: {
    label: "Volkswagen",
    initials: "VW",
    gradient: "from-blue-800 via-indigo-900 to-blue-950",
    accent: "#001e50",
  },
  vw: {
    label: "Volkswagen",
    initials: "VW",
    gradient: "from-blue-800 via-indigo-900 to-blue-950",
    accent: "#001e50",
  },
  nissan: {
    label: "Nissan",
    initials: "N",
    gradient: "from-zinc-700 to-black",
    accent: "#c3002f",
  },
  honda: {
    label: "Honda",
    initials: "H",
    gradient: "from-red-600 to-red-800",
    accent: "#cc0000",
  },
};

export function getVehicleBrandStyle(make: string): VehicleBrandStyle {
  const key = make.trim().toLowerCase();
  if (BRAND_MAP[key]) return BRAND_MAP[key];
  const words = make.trim().split(/\s+/).filter(Boolean);
  const initials =
    words
      .map((w) => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 3) || "CAR";
  return {
    label: make.trim() || "Vehicle",
    initials,
    gradient: "from-blue-600 via-purple-600 to-indigo-700",
    accent: "#4f46e5",
  };
}
