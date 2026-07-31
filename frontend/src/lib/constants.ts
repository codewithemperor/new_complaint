/** Static category list for the complaint form. Promote to a DB table if admins
 *  need to edit it later (M8 open question). */
export const CATEGORIES = [
  "INFRASTRUCTURE",
  "HEALTH",
  "EDUCATION",
  "SECURITY",
  "AGRICULTURE",
  "WATER_SANITATION",
  "ENVIRONMENT",
  "LAND_HOUSING",
  "TRANSPORT",
  "OTHER",
] as const;

export const LGAS = [
  "Asa",
  "Baruten",
  "Edu",
  "Ekiti",
  "Ifelodun",
  "Ilorin East",
  "Ilorin South",
  "Ilorin West",
  "Irepodun",
  "Isin",
  "Kaiama",
  "Moro",
  "Offa",
  "Oke Ero",
  "Oyun",
  "Pategi",
] as const;

export const CHANNELS = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "PHONE", label: "Phone" },
  { value: "LETTER", label: "Letter" },
  { value: "EMAIL", label: "Email" },
] as const;

export const PRIORITIES = [
  { value: "P1", label: "P1 — Critical" },
  { value: "P2", label: "P2 — High" },
  { value: "P3", label: "P3 — Medium" },
  { value: "P4", label: "P4 — Low" },
] as const;

export const SENSITIVITIES = [
  { value: "NORMAL", label: "Normal" },
  { value: "SENSITIVE", label: "Sensitive" },
  { value: "CONFIDENTIAL", label: "Confidential" },
] as const;
