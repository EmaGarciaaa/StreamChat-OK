import { useState, useEffect } from "react";
import { Role, ROLE_COLORS, ROLE_TEXT_COLORS } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, LayoutDashboard } from "lucide-react";

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void;
  roomName: string;
}

export function RoleSelection({ onSelectRole, roomName }: RoleSelectionProps) {
  const roles: Role[] = ["Conductor", "Coconductor", "Productora", "Operador de Video", "Sonidista"];
  const [occupiedRoles, setOccupiedRoles] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchOccupiedRoles = async () => {
      try {
        const res = await fetch(`/api/room/${roomName}/roles`);
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
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-neutral-800 p-3 rounded-2xl">
              <LayoutDashboard className="w-10 h-10 text-neutral-300" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-50">StreamSync</h1>
          <p className="text-neutral-400 flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            Sala: <span className="text-neutral-200 font-medium">{roomName}</span>
          </p>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-100">Selecciona tu Rol</CardTitle>
            <CardDescription className="text-neutral-400">
              Elige tu función para esta transmisión. La interfaz se adaptará según tu rol y la sala seleccionada.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {roles.map((role) => {
              const isOccupied = occupiedRoles.includes(role);
              return (
                <div key={role} className="flex flex-col gap-1">
                  <Button
                    variant="outline"
                    className={`w-full justify-start h-14 border-neutral-800 hover:bg-neutral-800 text-neutral-200 ${ROLE_TEXT_COLORS[role]} text-lg ${isOccupied ? 'opacity-70' : ''}`}
                    onClick={() => onSelectRole(role)}
                  >
                    <div className={`w-3 h-3 rounded-full mr-4 ${ROLE_COLORS[role]} ${isOccupied ? 'animate-pulse' : ''}`} />
                    {role} 
                    {isOccupied && <span className="ml-auto text-xs text-neutral-500 font-normal">Ocupado (Tomar control)</span>}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
