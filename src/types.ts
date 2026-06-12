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
  Coconductor: "bg-orange-500",
  Productora: "bg-yellow-500",
  "Operador de Video": "bg-blue-500",
  Sonidista: "bg-green-500",
};

export const ROLE_TEXT_COLORS: Record<Role, string> = {
  Conductor: "text-red-500",
  Coconductor: "text-orange-500",
  Productora: "text-yellow-500",
  "Operador de Video": "text-blue-500",
  Sonidista: "text-green-500",
};

export const MESSAGE_COLORS: Record<string, { bg: string, border: string, text: string }> = {
  neutral: { bg: "bg-neutral-800", border: "border-neutral-500", text: "text-white" },
  red: { bg: "bg-red-950", border: "border-red-500", text: "text-red-500" },
  yellow: { bg: "bg-yellow-950", border: "border-yellow-500", text: "text-yellow-500" },
  green: { bg: "bg-green-950", border: "border-green-500", text: "text-green-500" },
  blue: { bg: "bg-blue-950", border: "border-blue-500", text: "text-blue-500" },
};

export const PULSE_COLORS: Record<string, string> = {
  neutral: "bg-neutral-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
};
