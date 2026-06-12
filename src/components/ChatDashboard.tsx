import React, { useEffect, useRef, useState } from "react";
import { Role, MessagePayload, AlertPayload, ROLE_COLORS, ROLE_TEXT_COLORS, MESSAGE_COLORS, PULSE_COLORS } from "../types";
import { Button } from "@/components/ui/button";
import { useSocket } from "../hooks/useSocket";
import { Users, Send, Zap, Volume2, VolumeX, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { QuickActionsSettings } from "./QuickActionsSettings";
import { QuickAction } from "../types";

interface ChatDashboardProps {
  role: Role;
  roomName: string;
  language: string;
  setLanguage: (lang: string) => void;
  t: Record<string, string>;
  token?: string;
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: "1", label: "¡Ir a tanda!", shortcut: "1", color: "red" },
  { id: "2", label: "¡Cerrar idea!", shortcut: "2", color: "yellow" },
  { id: "3", label: "¡Al aire!", shortcut: "3", color: "green" },
  { id: "4", label: "Revisar Audio", shortcut: "4", color: "blue" },
  { id: "5", label: "Último Minuto", shortcut: "5", color: "red" },
];

export function ChatDashboard({ role, roomName, language, setLanguage, t, token = "" }: ChatDashboardProps) {
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

  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const { messages, onlineCount, connectedUsers, alert, sharedActions, sendMessage, sendAlert, updateSharedSettings } = useSocket(roomName, role, soundEnabled, token);

  const [quickActions, setQuickActions] = useState<QuickAction[]>(() => {
    // Intenta buscar ajustes de la sala actual, si no general.
    const saved = localStorage.getItem(`streamSync_quickActions_${roomName}`);
    return saved ? JSON.parse(saved) : DEFAULT_QUICK_ACTIONS;
  });

  useEffect(() => {
    if (sharedActions) {
      setQuickActions(sharedActions);
      localStorage.setItem(`streamSync_quickActions_${roomName}`, JSON.stringify(sharedActions));
    }
  }, [sharedActions, roomName]);

  const handleSaveActions = (actions: QuickAction[]) => {
    setQuickActions(actions);
    localStorage.setItem(`streamSync_quickActions_${roomName}`, JSON.stringify(actions));
    updateSharedSettings(actions);
  };

  const roleColor = ROLE_COLORS[role];
  const roleTextColor = ROLE_TEXT_COLORS[role];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in input
      if (document.activeElement?.tagName === "INPUT") return;
      
      const key = e.key.toLowerCase();
      const action = quickActions.find(a => a.shortcut.toLowerCase() === key);
      
      if (action) {
        handleSendAlert(action.label, action.color);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sendAlert, role, quickActions]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    sendMessage({
      id: crypto.randomUUID(),
      role,
      text,
      timestamp: Date.now(),
    });
    setText("");
  };

  const handleSendAlert = (label: string, color?: string) => {
    sendAlert({
      role,
      type: "URGENT",
      text: label,
      actionColor: color || "neutral",
    });
    sendMessage({
      id: crypto.randomUUID(),
      role,
      text: label,
      timestamp: Date.now(),
      isAlert: true,
      actionColor: color || "neutral",
    });
  };

  const MobileQuickActions = () => (
    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 p-4 lg:p-0">
      <h3 className="lg:block hidden text-neutral-400 font-medium mb-2">{t.quickActions}</h3>
      {quickActions.map((action) => {
        const cMap = MESSAGE_COLORS[action.color || "neutral"];
        return (
        <Button
          key={action.id}
          onClick={() => handleSendAlert(action.label, action.color)}
          className={`h-16 lg:h-14 lg:justify-start w-full bg-neutral-900 border-2 ${cMap.border} hover:opacity-80 transition-opacity ${cMap.text}`}
          variant="outline"
        >
          <Zap className={`w-4 h-4 mr-2 ${cMap.text}`} />
          {getTranslatedText(action.label)}
          {action.shortcut && (
            <span className="hidden lg:inline-block ml-auto text-xs uppercase opacity-70">[ {action.shortcut} ]</span>
          )}
        </Button>
      )})}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-neutral-50 overflow-hidden relative">
      {/* Alert Overlay */}
      {alert && (
        <div className="absolute inset-0 z-50 flex items-center justify-center animate-in fade-in zoom-in duration-200 pointer-events-none">
          <div className={`absolute inset-0 opacity-20 ${PULSE_COLORS[alert.actionColor || "red"]} animate-pulse`} />
          <div className={`bg-neutral-900 border-4 ${MESSAGE_COLORS[alert.actionColor || "red"].border} rounded-3xl p-8 shadow-2xl scale-110 flex flex-col items-center`}>
            <span className={`text-2xl font-bold mb-2 pb-2 border-b-2 border-neutral-800 ${MESSAGE_COLORS[alert.actionColor || "red"].text}`}>
              {t[`role_${alert.role.replace(/\s+/g, '')}`] || alert.role}
            </span>
            <span className="text-6xl md:text-8xl font-black text-white px-8 text-center uppercase tracking-tighter">
              {getTranslatedText(alert.text)}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 lg:h-20 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full ${roleColor} shadow-[0_0_15px_rgba(255,255,255,0.2)]`} />
          <h1 className="text-xl lg:text-3xl font-bold tracking-tight">
            StreamSync <span className="text-neutral-500 font-normal">| {t[`role_${role.replace(/\s+/g, '')}`] || role}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden md:flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-full border border-neutral-800">
            <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">{t.language}:</span>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-sm text-neutral-200 outline-none cursor-pointer border-none focus:ring-0"
            >
              <option value="es" className="bg-neutral-900">Español</option>
              <option value="en" className="bg-neutral-900">English</option>
              <option value="pt" className="bg-neutral-900">Português</option>
              <option value="fr" className="bg-neutral-900">Français</option>
              <option value="de" className="bg-neutral-900">Deutsch</option>
              <option value="it" className="bg-neutral-900">Italiano</option>
              <option value="zh" className="bg-neutral-900">中文 (Chinese)</option>
              <option value="ja" className="bg-neutral-900">日本語 (Japanese)</option>
              <option value="ru" className="bg-neutral-900">Русский (Russian)</option>
              <option value="ar" className="bg-neutral-900">العربية (Arabic)</option>
              <option value="hi" className="bg-neutral-900">हिन्दी (Hindi)</option>
            </select>
          </div>
          <QuickActionsSettings actions={quickActions} onSave={handleSaveActions} t={t} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-neutral-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 lg:w-6 lg:h-6" /> : <VolumeX className="w-5 h-5 lg:w-6 lg:h-6" />}
          </Button>
          
          <div className="hidden lg:flex items-center bg-neutral-950 rounded-full px-4 py-1 border border-neutral-800">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
            <Users className="w-4 h-4 mr-2 text-neutral-400" />
            <span className="font-mono text-lg">{onlineCount}</span>
          </div>

          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden border-neutral-800 bg-neutral-900" />}>
              <Menu className="w-5 h-5 text-neutral-400" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-neutral-900 border-neutral-800 text-white p-0">
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" /> {t.connectedUsers} ({onlineCount})
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {connectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className={`w-3 h-3 rounded-full ${ROLE_COLORS[user.role as Role] || 'bg-neutral-500'} shadow-[0_0_8px_currentColor]`} />
                    <span className="font-medium text-sm">
                      {t[`role_${user.role.replace(/\s+/g, '')}`] || user.role} {user.role === role ? t.you : ""}
                    </span>
                    <span className="ml-auto text-[10px] text-green-500 border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t.online}</span>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - PC */}
        <div className="hidden lg:flex w-64 bg-neutral-900 border-r border-neutral-800 flex-col py-6 px-4">
          <h2 className="text-neutral-500 font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {t.live} ({onlineCount})
          </h2>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {connectedUsers.map((user) => (
             <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
               <div className={`w-3 h-3 rounded-full ${ROLE_COLORS[user.role as Role] || 'bg-neutral-500'} shadow-[0_0_8px_currentColor]`} />
               <span className="font-medium text-sm">{t[`role_${user.role.replace(/\s+/g, '')}`] || user.role} {user.role === role ? t.you : ""}</span>
               <span className="ml-auto text-[10px] text-green-500 border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t.online}</span>
             </div>
            ))}
          </div>
          <div className="text-xs text-neutral-500 bg-neutral-950 p-4 rounded-xl mt-4 shrink-0">
            <span className="block mb-2 font-bold text-neutral-400">{t.keyboardShortcuts}</span>
            {quickActions.filter(a => a.shortcut).map((a) => (
              <span key={a.id} className="block mb-1 flex items-center justify-between">
                <span>{getTranslatedText(a.label)}</span>
                <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded ml-1 text-white uppercase">{a.shortcut}</kbd>
              </span>
            ))}
            {quickActions.filter(a => a.shortcut).length === 0 && (
              <span className="italic block mt-1">{t.noShortcuts}</span>
            )}
          </div>
        </div>

        {/* Center - Chat Flow */}
        <div className="flex-1 flex flex-col bg-neutral-950">
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                 <Zap className="w-16 h-16 mb-4 opacity-20" />
                 <p className="text-xl lg:text-3xl font-medium">{t.streamStarted}</p>
                 <p className="text-sm lg:text-lg opacity-60">{t.waitingInstructions}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === role ? 'items-end' : 'items-start'}`}
                >
                  <span className={`text-sm font-semibold mb-1 lg:text-lg ${ROLE_TEXT_COLORS[msg.role]}`}>
                    {t[`role_${msg.role.replace(/\s+/g, '')}`] || msg.role} {msg.role === role ? t.you : ""}
                  </span>
                  <div 
                    className={`
                      relative p-4 lg:p-6 rounded-2xl max-w-[85%] lg:max-w-[70%]
                      ${msg.isAlert 
                        ? `bg-neutral-900 border-2 ${MESSAGE_COLORS[msg.actionColor || 'red'].border} ${MESSAGE_COLORS[msg.actionColor || 'red'].text} font-bold` 
                        : 'bg-neutral-900 border border-neutral-800'}
                      ${msg.role === role ? 'rounded-tr-sm' : 'rounded-tl-sm'}
                    `}
                  >
                    <p className={`
                      leading-tight
                      ${msg.isAlert ? 'text-2xl lg:text-5xl uppercase tracking-tight' : 'text-xl lg:text-4xl'}
                      ${msg.role === 'Conductor' && !msg.isAlert ? 'text-2xl lg:text-5xl font-medium' : ''}
                    `}>
                      {getTranslatedText(msg.text)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 lg:p-6 bg-neutral-900 border-t border-neutral-800">
            <form onSubmit={handleSendMessage} className="flex gap-2 lg:gap-4 max-w-5xl mx-auto">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.typeMessage}
                className="flex-1 rounded-2xl bg-neutral-950 border border-neutral-800 px-6 py-4 lg:text-2xl outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-700"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!text.trim()}
                className={`h-auto w-16 lg:w-20 rounded-2xl ${roleColor} hover:opacity-90 disabled:opacity-50 disabled:bg-neutral-800 text-white`}
              >
                <Send className="w-6 h-6 lg:w-8 lg:h-8" />
              </Button>
            </form>
          </div>
        </div>

        {/* Right / Bottom - Quick Actions */}
        <div className="shrink-0 bg-neutral-950 lg:bg-neutral-900 lg:w-80 lg:border-l border-neutral-800 flex flex-col justify-end lg:justify-start overflow-y-auto max-h-[40vh] lg:max-h-none border-t lg:border-t-0 p-2 lg:p-6 pb-safe">
           <MobileQuickActions />
        </div>
      </div>
    </div>
  );
}
