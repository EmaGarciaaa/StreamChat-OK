import { useState, FormEvent } from "react";
import { Plus, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "../utils/config";

const API_BASE_URL = getBackendUrl();

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
      const res = await fetch(`${API_BASE_URL}/api/room/create`, { method: "POST" });
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
      const res = await fetch(`${API_BASE_URL}/api/room/${roomName}/verify-pin`, {
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
    <div className="relative min-h-screen bg-stream-dark overflow-hidden text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-neutral-800">
      {/* Background Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-stream-orange opacity-40 blur-3xl lg:blur-[120px] animate-blob-1"></div>
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-stream-teal opacity-30 blur-3xl lg:blur-[120px] animate-blob-2"></div>
        <div className="absolute bottom-[-20%] left-[15%] w-[60vw] h-[60vw] rounded-full bg-stream-orange opacity-20 blur-3xl lg:blur-[120px] animate-blob-3"></div>
      </div>

      <div className="relative z-10 w-[calc(100%-2rem)] mx-4 sm:w-full sm:max-w-md flex flex-col items-center animate-in fade-in zoom-in duration-500 bg-black/20 backdrop-blur-lg border border-stream-ash/30 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 text-center">
          StreamChat
        </h1>
        <p className="text-neutral-300 text-center mb-6 sm:mb-10 text-sm sm:text-lg">
          Acceso seguro a salas de transmisión
        </p>

        {mode === "select" && (
          <div className="w-full space-y-4">
            <Button 
              onClick={() => { setMode("create"); handleCreate(); }}
              className="w-full h-14 sm:h-16 text-base sm:text-lg bg-white text-black hover:bg-neutral-200 font-bold rounded-xl"
            >
              <Plus className="mr-2 w-5 h-5" /> Crear Sala Segura
            </Button>
            <Button 
              onClick={() => setMode("join")}
              className="w-full h-14 sm:h-16 text-base sm:text-lg bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 font-bold rounded-xl"
            >
              <LogIn className="mr-2 w-5 h-5" /> Unirse a una Sala
            </Button>
          </div>
        )}

        {mode === "create" && createdRoomInfo && (
          <div className="w-full bg-black/20 border border-stream-ash/20 p-4 sm:p-8 rounded-2xl text-center space-y-4 sm:space-y-6">
            <h2 className="text-white font-bold text-lg sm:text-xl">Sala Creada con Éxito</h2>
            <div className="space-y-3 sm:space-y-4 text-left bg-black/40 p-4 sm:p-6 rounded-xl border border-stream-ash/20">
              <div>
                <p className="text-stream-ash text-xs sm:text-sm font-medium uppercase tracking-wider mb-1">ID de la Sala</p>
                <p className="text-xl sm:text-2xl font-mono text-stream-cream select-all">{createdRoomInfo.roomId}</p>
              </div>
              <div className="h-px w-full bg-stream-ash/20" />
              <div>
                <p className="text-stream-ash text-xs sm:text-sm font-medium uppercase tracking-wider mb-1">PIN de Acceso</p>
                <p className="text-2xl sm:text-3xl font-mono text-stream-teal font-bold tracking-[0.5em]">{createdRoomInfo.pin}</p>
              </div>
            </div>
            <p className="text-stream-ash text-xs sm:text-sm">
              Comparte este ID y PIN con tu equipo. Esta es la única forma de acceder a tu sala.
            </p>
            <Button 
              onClick={() => onSuccess(createdRoomInfo.roomId, sessionStorage.getItem(`streamSync_token_${createdRoomInfo.roomId}`)!)}
              className="w-full h-12 sm:h-14 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl text-base sm:text-lg mt-4"
            >
              Ingresar a la Sala <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="w-full space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-stream-ash uppercase tracking-wider">
                ID de la Sala
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => { setError(null); setRoomName(e.target.value.toLowerCase().trim()); }}
                className="w-full bg-black/40 border border-stream-ash/30 rounded-xl px-4 py-3 sm:py-4 text-base sm:text-lg outline-none focus:border-stream-orange transition-colors placeholder:text-stream-ash/50 text-stream-cream"
                placeholder="Ej. w2x9k"
                disabled={isProcessing}
                autoFocus
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-stream-ash uppercase tracking-wider">
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
                className={`w-full bg-black/40 border ${error ? 'border-red-500' : 'border-stream-ash/30'} rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-center text-2xl sm:text-4xl tracking-[1em] outline-none focus:border-stream-orange transition-colors placeholder:text-stream-ash/30 font-mono text-stream-teal`}
                placeholder="••••"
                disabled={isProcessing}
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs sm:text-sm text-center mt-2 font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-neutral-200 h-12 sm:h-14 rounded-xl text-base sm:text-lg font-bold mt-4"
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
