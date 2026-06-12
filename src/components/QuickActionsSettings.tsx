import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Save, X, Plus } from "lucide-react";
import { QuickAction } from "../types";

interface QuickActionsSettingsProps {
  actions: QuickAction[];
  onSave: (actions: QuickAction[]) => void;
  t: Record<string, string>;
}

export function QuickActionsSettings({ actions, onSave, t }: QuickActionsSettingsProps) {
  const [open, setOpen] = useState(false);
  const [localActions, setLocalActions] = useState<QuickAction[]>(actions);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalActions(actions);
    }
    setOpen(isOpen);
  };

  const handleActionChange = (id: string, field: "label" | "shortcut" | "color", value: string) => {
    setLocalActions(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleRemoveAction = (id: string) => {
    setLocalActions(prev => prev.filter(a => a.id !== id));
  };

  const handleAddAction = () => {
    const newId = crypto.randomUUID();
    setLocalActions(prev => [...prev, { id: newId, label: t.newAction, shortcut: "" }]);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white" />}>
        <Settings className="w-5 h-5 lg:w-6 lg:h-6" />
      </DialogTrigger>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t.quickActionsSettings}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {localActions.map((action, idx) => (
            <div key={action.id} className="flex items-center gap-2 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={getTranslatedText(action.label)}
                  onChange={(e) => handleActionChange(action.id, "label", e.target.value)}
                  placeholder={t.alertMessage}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
                />
              </div>
              <div className="w-20">
                <input
                  type="text"
                  value={action.shortcut}
                  onChange={(e) => handleActionChange(action.id, "shortcut", e.target.value)}
                  placeholder={t.key}
                  maxLength={1}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm outline-none focus:border-neutral-500 text-center uppercase"
                />
              </div>
              <div className="w-28">
                <select
                  value={action.color || "neutral"}
                  onChange={(e) => handleActionChange(action.id, "color", e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm outline-none focus:border-neutral-500 text-neutral-200"
                >
                  <option value="neutral">{t.colorNeutral}</option>
                  <option value="red">{t.colorRed}</option>
                  <option value="yellow">{t.colorYellow}</option>
                  <option value="green">{t.colorGreen}</option>
                  <option value="blue">{t.colorBlue}</option>
                </select>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleRemoveAction(action.id)}
                className="text-neutral-500 hover:text-red-400 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            onClick={handleAddAction}
            className="w-full border-neutral-800 border-dashed bg-transparent hover:bg-neutral-800 text-neutral-400"
          >
            <Plus className="w-4 h-4 mr-2" /> {t.addAction}
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white">
            {t.cancel}
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            {t.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
