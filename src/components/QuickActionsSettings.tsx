import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, X, Plus } from "lucide-react";
import { QuickAction } from "../types";

interface QuickActionsSettingsProps {
  actions: QuickAction[];
  onSave: (actions: QuickAction[]) => void;
  t: Record<string, string>;
}

const COLOR_PALETTE = [
  { value: 'neutral', bgClass: 'bg-neutral-500' },
  { value: 'red', bgClass: 'bg-red-500' },
  { value: 'streamOrange', bgClass: 'bg-stream-orange' },
  { value: 'amber', bgClass: 'bg-amber-500' },
  { value: 'yellow', bgClass: 'bg-yellow-500' },
  { value: 'lime', bgClass: 'bg-lime-500' },
  { value: 'green', bgClass: 'bg-green-500' },
  { value: 'emerald', bgClass: 'bg-emerald-500' },
  { value: 'streamTeal', bgClass: 'bg-stream-teal' },
  { value: 'cyan', bgClass: 'bg-cyan-500' },
  { value: 'blue', bgClass: 'bg-blue-500' },
  { value: 'indigo', bgClass: 'bg-indigo-500' },
  { value: 'violet', bgClass: 'bg-violet-500' },
  { value: 'purple', bgClass: 'bg-purple-500' },
  { value: 'fuchsia', bgClass: 'bg-fuchsia-500' },
  { value: 'pink', bgClass: 'bg-pink-500' },
];

export function QuickActionsSettings({ actions, onSave, t }: QuickActionsSettingsProps) {
  const [open, setOpen] = useState(false);
  const [localActions, setLocalActions] = useState<QuickAction[]>(actions);
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);

  const handleOpen = () => {
    setLocalActions(actions);
    setActiveColorPickerId(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleActionChange = (id: string, field: "label" | "shortcut" | "color", value: string) => {
    setLocalActions(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleRemoveAction = (id: string) => {
    setLocalActions(prev => prev.filter(a => a.id !== id));
  };

  const handleAddAction = () => {
    const newId = crypto.randomUUID();
    setLocalActions(prev => [...prev, { id: newId, label: t.newAction || "NUEVA ACCIÓN", shortcut: "" }]);
  };

  const handleSave = () => {
    // Basic validation to prevent completely empty labels
    const validActions = localActions.filter(a => a.label.trim() !== "");
    onSave(validActions);
    setOpen(false);
  };

  const getTranslatedText = (text: string) => {
    const map: Record<string, string> = {
      "¡Ir a tanda!": t.alert_gotoBreak,
      "¡Cerrar idea!": t.alert_closeIdea,
      "¡Al aire!": t.alert_onAir,
      "Revisar Audio": t.alert_checkAudio,
      "Último Minuto": t.alert_lastMinute,
    };
    return map[text] || text;
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={handleOpen}
        className="text-stream-orange font-bold tracking-widest uppercase border-stream-teal hover:bg-stream-teal/10 hover:text-stream-orange h-9 px-3 lg:h-10 lg:px-4"
      >
        PERSONALIZAR
      </Button>

      {open && (
        <div className="fixed inset-0 z-[100] w-full h-full bg-stream-dark/95 backdrop-blur-xl flex flex-col pt-4 sm:pt-8 animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
          {/* Header */}
          <div className="px-6 lg:px-12 pb-6 border-b border-stream-ash/20 shrink-0 flex items-center justify-between mx-auto w-full max-w-7xl">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-stream-cream">Configuración de la Sala</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              className="text-stream-ash hover:bg-black/20 hover:text-white rounded-full w-12 h-12"
            >
              <X className="w-8 h-8" />
            </Button>
          </div>
          
          {/* Main Grid Content */}
          <div className="flex-1 px-6 lg:px-12 py-8 w-full max-w-7xl mx-auto space-y-6">
            {localActions.map((action, idx) => {
              const currentColorDef = COLOR_PALETTE.find(c => c.value === (action.color || "neutral")) || COLOR_PALETTE[0];
              const isPickerOpen = activeColorPickerId === action.id;

              return (
              <div key={action.id} className="flex flex-col xl:flex-row xl:items-center gap-4 lg:gap-6 bg-black/20 p-5 rounded-2xl border border-stream-ash/20 hover:border-stream-orange/30 transition-colors shadow-lg">
                <div className="flex items-center gap-4 lg:gap-6 w-full">
                  
                  {/* Shortcut Indicator */}
                  <div className="flex flex-col space-y-2 shrink-0">
                    <label className="text-xs text-stream-ash uppercase tracking-wider font-semibold">ATAJO</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-stream-ash/50 font-mono text-lg">[</span>
                      </div>
                      <input
                        type="text"
                        value={action.shortcut}
                        onChange={(e) => handleActionChange(action.id, "shortcut", e.target.value)}
                        placeholder="-"
                        maxLength={1}
                        className="w-16 h-14 bg-black/50 border border-stream-ash/30 rounded-xl px-2 text-center text-xl outline-none focus:border-stream-orange focus:ring-1 focus:ring-stream-orange uppercase text-stream-teal font-bold transition-all"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-stream-ash/50 font-mono text-lg">]</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Label Input */}
                  <div className="flex-1 flex flex-col space-y-2 min-w-[200px]">
                    <label className="text-xs text-stream-ash uppercase tracking-wider font-semibold">TÍTULO DEL BOTÓN</label>
                    <input
                      type="text"
                      value={getTranslatedText(action.label)}
                      onChange={(e) => handleActionChange(action.id, "label", e.target.value)}
                      placeholder={t.alertMessage}
                      className="w-full bg-black/50 border border-stream-ash/30 rounded-xl px-6 h-14 text-lg lg:text-xl outline-none focus:border-stream-orange focus:ring-1 focus:ring-stream-orange text-stream-cream transition-all font-medium"
                    />
                  </div>

                  {/* Color Picker */}
                  <div className="flex flex-col space-y-2 shrink-0">
                    <label className="text-xs text-stream-ash uppercase tracking-wider font-semibold w-full text-center">COLOR</label>
                    <div className="relative flex justify-center">
                      <button
                        type="button"
                        onClick={() => setActiveColorPickerId(isPickerOpen ? null : action.id)}
                        className={`w-14 h-14 rounded-full ${currentColorDef.bgClass} shadow-md border-2 ${isPickerOpen ? 'border-stream-cream scale-110' : 'border-stream-ash/50 hover:border-stream-cream hover:scale-105'} transition-all`}
                        title="Elegir Color"
                      />
                      {isPickerOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveColorPickerId(null)} />
                          <div className={`absolute ${idx >= 2 && idx >= localActions.length - 2 ? 'bottom-16' : 'top-16'} right-0 xl:left-1/2 xl:-translate-x-1/2 z-50 w-72 lg:w-96 bg-stream-dark border-2 border-stream-ash/40 rounded-2xl p-4 shadow-[0_10px_50px_rgba(0,0,0,0.8)] grid grid-cols-4 lg:grid-cols-8 gap-3 animate-in fade-in zoom-in-95 duration-200`}>
                            {COLOR_PALETTE.map(color => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() => {
                                  handleActionChange(action.id, "color", color.value);
                                  setActiveColorPickerId(null);
                                }}
                                className={`w-12 h-12 lg:w-10 lg:h-10 rounded-full mx-auto ${color.bgClass} transition-transform ${
                                  (action.color || "neutral") === color.value 
                                    ? 'ring-4 ring-stream-cream ring-offset-2 ring-offset-stream-dark scale-110' 
                                    : 'hover:scale-110'
                                }`}
                                title={color.value}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="flex flex-col space-y-2 shrink-0 pt-6">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveAction(action.id)}
                      className="text-stream-ash hover:bg-black/40 hover:text-red-400 h-14 w-14 rounded-xl transition-colors"
                      title="Eliminar Acción"
                    >
                      <X className="w-8 h-8" />
                    </Button>
                  </div>

                </div>
              </div>
            )})}
            
            <Button 
              variant="outline" 
              onClick={handleAddAction}
              className="w-full border-2 border-stream-ash/30 border-dashed bg-black/10 hover:bg-black/30 hover:border-stream-ash text-stream-ash hover:text-stream-cream h-20 rounded-2xl text-xl font-bold tracking-wide transition-all mt-4"
            >
              <Plus className="w-8 h-8 mr-4" /> {t.addAction || "AGREGAR NUEVA ACCIÓN"}
            </Button>
          </div>

          {/* Footer Save Area */}
          <div className="border-t border-stream-ash/20 bg-stream-dark/50 backdrop-blur-md shrink-0 py-6 px-6 lg:px-12">
             <div className="flex justify-end gap-4 max-w-7xl mx-auto">
              <Button 
                variant="ghost" 
                onClick={handleClose} 
                className="text-stream-ash hover:text-stream-cream hover:bg-black/20 h-14 px-8 text-xl rounded-xl font-medium"
              >
                {t.cancel || "Cancelar"}
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-stream-orange hover:bg-stream-orange/90 text-stream-dark h-14 px-10 text-xl font-black tracking-wide rounded-xl shadow-[0_0_20px_rgba(229,119,52,0.3)] transition-all"
              >
                <Save className="w-6 h-6 mr-3 text-stream-dark" />
                {t.save || "Guardar Cambios"}
              </Button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
