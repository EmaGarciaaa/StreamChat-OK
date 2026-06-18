import { useState, useEffect } from "react";
import { Role, ROLE_COLORS, ROLE_HOVER_BG, ROLE_BORDER_COLORS } from "../types";
import { Button } from "@/components/ui/button";
import { Users, LayoutDashboard } from "lucide-react";
import { getBackendUrl } from "../utils/config";

const API_BASE_URL = getBackendUrl();

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void;
  roomName: string;
  language: string;
  setLanguage: (lang: string) => void;
  t: Record<string, string>;
}

export function RoleSelection({ onSelectRole, roomName, language, setLanguage, t }: RoleSelectionProps) {
  const roles: Role[] = ["Conductor", "Coconductor", "Productora", "Operador de Video", "Sonidista"];
  const [occupiedRoles, setOccupiedRoles] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchOccupiedRoles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/room/${roomName}/roles`);
        const data = await res.json();
        setOccupiedRoles(data.occupiedRoles);
      } catch (err) {
        console.error("No se pudieron cargar los roles", err);
      }
    };
    fetchOccupiedRoles();
    
    // Opcional: refrescar cada pocos segundos por si alguien entra antes
    const interval = setInterval(fetchOccupiedRoles, 3000);
    return () => clearInterval(interval);
  }, [roomName]);

  return (
    <div className="relative min-h-screen bg-stream-dark overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background Blobs (Attenuated for continuity) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-stream-orange opacity-20 blur-3xl lg:blur-[120px] animate-blob-1"></div>
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-stream-teal opacity-15 blur-3xl lg:blur-[120px] animate-blob-2"></div>
        <div className="absolute bottom-[-20%] left-[15%] w-[60vw] h-[60vw] rounded-full bg-stream-orange opacity-10 blur-3xl lg:blur-[120px] animate-blob-3"></div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/20 border border-stream-ash/20 px-3 py-1.5 rounded-full backdrop-blur-md">
        <span className="text-xs text-stream-ash uppercase font-bold tracking-wider">{t.language}:</span>
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-transparent text-sm text-stream-cream outline-none cursor-pointer border-none focus:ring-0"
        >
          <option value="es" className="bg-stream-dark">Español</option>
          <option value="en" className="bg-stream-dark">English</option>
          <option value="pt" className="bg-stream-dark">Português</option>
          <option value="fr" className="bg-stream-dark">Français</option>
          <option value="de" className="bg-stream-dark">Deutsch</option>
          <option value="it" className="bg-stream-dark">Italiano</option>
          <option value="zh" className="bg-stream-dark">中文 (Chinese)</option>
          <option value="ja" className="bg-stream-dark">日本語 (Japanese)</option>
          <option value="ru" className="bg-stream-dark">Русский (Russian)</option>
          <option value="ar" className="bg-stream-dark">العربية (Arabic)</option>
          <option value="hi" className="bg-stream-dark">हिन्दी (Hindi)</option>
        </select>
      </div>

      <div className="relative z-10 max-w-md w-full animate-in fade-in zoom-in duration-500 bg-black/20 backdrop-blur-lg border border-stream-ash/30 rounded-3xl p-8 sm:p-10 shadow-2xl">
        <div className="text-center space-y-2 mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-black/30 border border-stream-ash/20 p-4 rounded-2xl shadow-inner">
              <LayoutDashboard className="w-10 h-10 text-stream-cream" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stream-cream">StreamChat</h1>
          <p className="text-stream-ash flex items-center justify-center gap-2">
            <Users className="w-4 h-4 text-stream-teal" />
            {t.room} <span className="text-stream-cream font-medium tracking-wide">{roomName}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-stream-cream px-2">{t.selectRole}</h2>
            <p className="text-sm text-stream-ash px-2 mt-1">{t.selectRoleDesc}</p>
          </div>
          
          <div className="grid gap-3">
            {roles.map((role) => {
              const isOccupied = occupiedRoles.includes(role);
              const hoverEffect = ROLE_HOVER_BG[role];
              const borderColor = ROLE_BORDER_COLORS[role];
              
              return (
                <div key={role} className="flex flex-col gap-1">
                  <Button
                    variant="outline"
                    className={`w-full justify-start h-14 bg-black/30 border ${borderColor} text-stream-cream text-lg font-medium tracking-wide transition-all duration-300 ${isOccupied ? 'opacity-50 grayscale cursor-not-allowed' : `${hoverEffect}`}`}
                    onClick={() => {
                        if (!isOccupied) onSelectRole(role);
                    }}
                    disabled={isOccupied}
                  >
                    <div className={`w-3 h-3 rounded-full mr-4 ${ROLE_COLORS[role]} shadow-[0_0_8px_currentColor]`} />
                    {t[`role_${role.replace(/\s+/g, '')}`] || role} 
                    {isOccupied && <span className="ml-auto text-xs text-stream-salmon font-semibold uppercase tracking-wider">{t.occupied}</span>}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
