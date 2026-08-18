/**
 * The seven complaint categories / departments. These mirror the seeded
 * departments and are the single source of truth used by the landing page and
 * the complaint submission flow.
 */
export const DEPARTMENTS = [
  {
    name: "Information Services",
    description: "ICT, records and information management.",
    icon: "server",
  },
  {
    name: "Public Orientation",
    description: "Public enquiries, orientation and citizen engagement.",
    icon: "compass",
  },
  {
    name: "Graphics",
    description: "Design, printing and visual communications.",
    icon: "palette",
  },
  {
    name: "Culture and Tourism",
    description: "Culture, arts, heritage and tourism.",
    icon: "landmark",
  },
  {
    name: "Finance & Supply",
    description: "Finance, accounts and supply chain.",
    icon: "wallet",
  },
  {
    name: "Planning, Research and Statistics",
    description: "Planning, research, monitoring and statistics.",
    icon: "chart",
  },
  {
    name: "Admin Department",
    description: "Administration and human resources.",
    icon: "building",
  },
] as const;

/** Complaint categories are issue types. Routing maps them to departments. */
export const CATEGORIES = [
  "Service quality",
  "Delayed action",
  "Staff conduct",
  "Payment or procurement",
  "Public information request",
  "Facility or equipment",
  "Safety or security",
  "Records or data",
  "General complaint",
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
