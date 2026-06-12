export type Role =
  | "Conductor"
  | "Coconductor"
  | "Productora"
  | "Operador de Video"
  | "Sonidista";

export interface MessagePayload {
  id: string;
  room: string;
  role: Role;
  text: string;
  timestamp: number;
  isAlert?: boolean;
  actionColor?: string;
}

export interface AlertPayload {
  room: string;
  role: Role;
  type: string;
  text: string;
  actionColor?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  shortcut: string;
  color?: string;
}

export const ROLE_COLORS: Record<Role, string> = {
  Conductor: "bg-red-500",
  Coconductor: "bg-stream-orange",
  Productora: "bg-stream-cream",
  "Operador de Video": "bg-stream-teal",
  Sonidista: "bg-blue-500",
};

export const ROLE_TEXT_COLORS: Record<Role, string> = {
  Conductor: "text-red-500",
  Coconductor: "text-stream-orange",
  Productora: "text-stream-cream",
  "Operador de Video": "text-stream-teal",
  Sonidista: "text-blue-500",
};

export const ROLE_BORDER_COLORS: Record<Role, string> = {
  Conductor: "border-red-500",
  Coconductor: "border-stream-orange",
  Productora: "border-stream-cream",
  "Operador de Video": "border-stream-teal",
  Sonidista: "border-blue-500",
};

export const ROLE_HOVER_BG: Record<Role, string> = {
  Conductor: "hover:bg-red-500/20 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]",
  Coconductor: "hover:bg-stream-orange/20 hover:border-stream-orange hover:shadow-[0_0_15px_rgba(229,119,52,0.3)]",
  Productora: "hover:bg-stream-cream/20 hover:border-stream-cream hover:shadow-[0_0_15px_rgba(248,235,207,0.3)]",
  "Operador de Video": "hover:bg-stream-teal/20 hover:border-stream-teal hover:shadow-[0_0_15px_rgba(1,117,122,0.3)]",
  Sonidista: "hover:bg-blue-500/20 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]",
};

export const MESSAGE_COLORS: Record<string, { bg: string, border: string, text: string }> = {
  neutral: { bg: "bg-neutral-800", border: "border-neutral-500", text: "text-white" },
  red: { bg: "bg-red-950", border: "border-red-500", text: "text-red-500" },
  yellow: { bg: "bg-yellow-950", border: "border-yellow-500", text: "text-yellow-500" },
  green: { bg: "bg-green-950", border: "border-green-500", text: "text-green-500" },
  blue: { bg: "bg-blue-950", border: "border-blue-500", text: "text-blue-500" },
  streamOrange: { bg: "bg-stream-orange/20", border: "border-stream-orange", text: "text-stream-orange" },
  streamTeal: { bg: "bg-stream-teal/20", border: "border-stream-teal", text: "text-stream-teal" },
  streamCream: { bg: "bg-stream-cream/20", border: "border-stream-cream", text: "text-stream-cream" },
  streamSalmon: { bg: "bg-stream-salmon/20", border: "border-stream-salmon", text: "text-stream-salmon" },
  purple: { bg: "bg-purple-950", border: "border-purple-500", text: "text-purple-500" },
  pink: { bg: "bg-pink-950", border: "border-pink-500", text: "text-pink-500" },
  indigo: { bg: "bg-indigo-950", border: "border-indigo-500", text: "text-indigo-500" },
  cyan: { bg: "bg-cyan-950", border: "border-cyan-500", text: "text-cyan-500" },
  emerald: { bg: "bg-emerald-950", border: "border-emerald-500", text: "text-emerald-500" },
  lime: { bg: "bg-lime-950", border: "border-lime-500", text: "text-lime-500" },
  amber: { bg: "bg-amber-950", border: "border-amber-500", text: "text-amber-500" },
  fuchsia: { bg: "bg-fuchsia-950", border: "border-fuchsia-500", text: "text-fuchsia-500" },
};

export const PULSE_COLORS: Record<string, string> = {
  neutral: "bg-neutral-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  streamOrange: "bg-stream-orange",
  streamTeal: "bg-stream-teal",
  streamCream: "bg-stream-cream",
  streamSalmon: "bg-stream-salmon",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  indigo: "bg-indigo-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
  lime: "bg-lime-500",
  amber: "bg-amber-500",
  fuchsia: "bg-fuchsia-500",
};
