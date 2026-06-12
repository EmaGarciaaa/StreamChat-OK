import { useState, FormEvent } from "react";
import { Shield, Plus, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessGateProps {
  onSuccess: (room: string, token: string) => void;
  t: Record<string, string>;
}

export function AccessGate({ onSuccess, t }: AccessGateProps) {
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [roomName, setRoomName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdRoomInfo, setCreatedRoomInfo] = useState<{ roomId: string; pin: string } | null>(null);

  const handleCreate = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/room/create", { method: "POST" });
      const data = await res.json();
      setCreatedRoomInfo({ roomId: data.roomId, pin: data.pin });
      
      // We also store token locally
      sessionStorage.setItem(`streamSync_token_${data.roomId}`, data.token);
    } catch {
      setError("Error al crear la sala");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomName || pin.length !== 4) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/room/${roomName}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      
      if (data.success) {
        sessionStorage.setItem(`streamSync_token_${roomName}`, data.token);
        onSuccess(roomName, data.token);
      } else {
        setError(data.error || "PIN o Sala incorrectos");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-neutral-800">
      <div className="w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex items-center justify-center mb-8 border border-neutral-800 shadow-2xl">
          <Shield className="w-10 h-10 text-neutral-400" />
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2 text-center">
          StreamSync Gate
        </h1>
        <p className="text-neutral-500 text-center mb-10 text-lg">
          Acceso seguro a salas de transmisión
        </p>

        {mode === "select" && (
          <div className="w-full space-y-4">
            <Button 
              onClick={() => { setMode("create"); handleCreate(); }}
              className="w-full h-16 text-lg bg-white text-black hover:bg-neutral-200 font-bold rounded-xl"
            >
              <Plus className="mr-2 w-5 h-5" /> Crear Sala Segura
            </Button>
            <Button 
              onClick={() => setMode("join")}
              className="w-full h-16 text-lg bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 font-bold rounded-xl"
            >
              <LogIn className="mr-2 w-5 h-5" /> Unirse a una Sala
            </Button>
          </div>
        )}

        {mode === "create" && createdRoomInfo && (
          <div className="w-full bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center space-y-6">
            <h2 className="text-white font-bold text-xl">Sala Creada con Éxito</h2>
            <div className="space-y-4 text-left bg-neutral-950 p-6 rounded-xl border border-neutral-900">
              <div>
                <p className="text-neutral-500 text-sm font-medium uppercase tracking-wider mb-1">ID de la Sala</p>
                <p className="text-2xl font-mono text-white select-all">{createdRoomInfo.roomId}</p>
              </div>
              <div className="h-px w-full bg-neutral-800" />
              <div>
                <p className="text-neutral-500 text-sm font-medium uppercase tracking-wider mb-1">PIN de Acceso</p>
                <p className="text-3xl font-mono text-green-500 font-bold tracking-[0.5em]">{createdRoomInfo.pin}</p>
              </div>
            </div>
            <p className="text-neutral-400 text-sm">
              Comparte este ID y PIN con tu equipo. Esta es la única forma de acceder a tu sala.
            </p>
            <Button 
              onClick={() => onSuccess(createdRoomInfo.roomId, sessionStorage.getItem(`streamSync_token_${createdRoomInfo.roomId}`)!)}
              className="w-full h-14 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl text-lg mt-4"
            >
              Ingresar a la Sala <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 uppercase tracking-wider">
                ID de la Sala
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => { setError(null); setRoomName(e.target.value.toLowerCase().trim()); }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-lg outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-700"
                placeholder="Ej. w2x9k"
                disabled={isProcessing}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 uppercase tracking-wider">
                PIN de 4 dígitos
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setError(null);
                  setPin(e.target.value.replace(/[^0-9]/g, ''));
                }}
                className={`w-full bg-neutral-900 border ${error ? 'border-red-500' : 'border-neutral-800'} rounded-xl px-6 py-4 text-center text-4xl tracking-[1em] outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-800 font-mono`}
                placeholder="••••"
                disabled={isProcessing}
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center mt-2 font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-neutral-200 h-14 rounded-xl text-lg font-bold mt-4"
              disabled={pin.length !== 4 || !roomName || isProcessing}
            >
              {isProcessing ? "Verificando..." : "Acceder"}
            </Button>
            <Button 
              type="button"
              variant="ghost"
              onClick={() => setMode("select")}
              className="w-full text-neutral-500 hover:text-white"
            >
              Volver
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
