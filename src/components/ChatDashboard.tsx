import React, { useEffect, useRef, useState } from "react";
import { Role, MessagePayload, AlertPayload, ROLE_COLORS, ROLE_TEXT_COLORS, MESSAGE_COLORS, PULSE_COLORS } from "../types";
import { Button } from "@/components/ui/button";
import { useSocket } from "../hooks/useSocket";
import { Users, Send, Zap, Volume2, VolumeX, Menu, LogOut } from "lucide-react";
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

  const textMap: Record<string, string> = {
    "leaveRoom": t.leaveRoom || "Salir",
  };

  const { messages, onlineCount, connectedUsers, alert, sharedActions, sendMessage, sendAlert, updateSharedSettings, disconnect } = useSocket(roomName, role, soundEnabled, token);

  const handleLeaveRoom = () => {
    disconnect();
    sessionStorage.removeItem(`streamSync_token_${roomName}`);
    localStorage.removeItem("streamSync_role"); // Optional based on if role persists, but user requested clearing session
    // Redirect to home
    window.location.href = "/";
  };

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
    <div className="grid grid-cols-1 gap-3 p-0">
      {quickActions.map((action) => {
        const cMap = MESSAGE_COLORS[action.color || "neutral"] || MESSAGE_COLORS.neutral;
        return (
        <Button
          key={action.id}
          onClick={() => handleSendAlert(action.label, action.color)}
          className={`h-14 justify-start w-full bg-black/20 border-2 ${cMap.border} hover:opacity-80 transition-opacity ${cMap.text} font-bold rounded-xl`}
          variant="outline"
        >
          <Zap className={`w-4 h-4 mr-2 shrink-0 ${cMap.text}`} />
          <span className="truncate pr-1">{getTranslatedText(action.label)}</span>
          {action.shortcut && (
            <span className="hidden lg:inline-block ml-auto text-xs uppercase opacity-70 font-mono shrink-0">[ {action.shortcut} ]</span>
          )}
        </Button>
      )})}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-stream-dark text-stream-cream overflow-hidden relative">
      {/* Alert Overlay */}
      {alert && (
        <div className="absolute inset-0 z-50 flex items-center justify-center animate-in fade-in zoom-in duration-200 pointer-events-none">
          <div className={`absolute inset-0 opacity-20 ${PULSE_COLORS[alert.actionColor || "red"]} animate-pulse`} />
          <div className={`bg-black/80 backdrop-blur-md border-4 ${MESSAGE_COLORS[alert.actionColor || "red"].border} rounded-3xl p-8 shadow-2xl scale-110 flex flex-col items-center`}>
            <span className={`text-2xl font-bold mb-2 pb-2 border-b-2 border-stream-ash/20 ${MESSAGE_COLORS[alert.actionColor || "red"].text}`}>
              {t[`role_${alert.role.replace(/\s+/g, '')}`] || alert.role}
            </span>
            <span className="text-6xl md:text-8xl font-black text-stream-cream px-8 text-center uppercase tracking-tighter">
              {getTranslatedText(alert.text)}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 lg:h-20 bg-black/10 border-b border-stream-ash/20 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full ${roleColor} shadow-[0_0_15px_rgba(255,255,255,0.2)]`} />
          <h1 className="text-xl lg:text-3xl font-bold tracking-tight">
            StreamChat <span className="text-neutral-500 font-normal">| {t[`role_${role.replace(/\s+/g, '')}`] || role}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden md:flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-stream-ash/20">
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
          <QuickActionsSettings actions={quickActions} onSave={handleSaveActions} t={t} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-stream-ash hover:text-stream-cream hover:bg-black/20"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 lg:w-6 lg:h-6" /> : <VolumeX className="w-5 h-5 lg:w-6 lg:h-6" />}
          </Button>
          
          <div className="hidden lg:flex items-center bg-black/20 rounded-full px-4 py-1 border border-stream-ash/20">
            <div className="w-2 h-2 rounded-full bg-stream-teal animate-pulse mr-2" />
            <Users className="w-4 h-4 mr-2 text-stream-ash" />
            <span className="font-mono text-lg">{onlineCount}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLeaveRoom}
            className="hidden lg:flex text-neutral-400 hover:text-red-500 hover:bg-red-500/10"
            title={textMap.leaveRoom || "Salir de la sala"}
          >
            <LogOut className="w-5 h-5" />
          </Button>

          {/* Quick Actions Trigger for Mobile */}
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden border-stream-ash/20 bg-black/20 text-stream-orange-400 hover:text-stream-orange" />}>
              <Zap className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-stream-dark border-l border-stream-ash/20 text-stream-cream p-0 flex flex-col">
              <div className="p-4 border-b border-stream-ash/20 flex flex-col">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-stream-orange animate-pulse" /> {t.quickActions || "Alertas Rápidas"}
                </h2>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <MobileQuickActions />
              </div>
            </SheetContent>
          </Sheet>

          {/* Connected Users Trigger for Mobile */}
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden border-stream-ash/20 bg-black/20" />}>
              <Menu className="w-5 h-5 text-stream-ash" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-stream-dark border-r border-stream-ash/20 text-stream-cream p-0 flex flex-col">
              <div className="p-4 border-b border-stream-ash/20 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-stream-teal" /> {t.connectedUsers} ({onlineCount})
                </h2>
              </div>
              <div className="p-4 space-y-2 flex-1 overflow-y-auto">
                {connectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-stream-ash/20">
                    <div className={`w-3 h-3 rounded-full ${ROLE_COLORS[user.role as Role] || 'bg-stream-ash'} shadow-[0_0_8px_currentColor]`} />
                    <span className="font-medium text-sm">
                      {t[`role_${user.role.replace(/\s+/g, '')}`] || user.role} {user.role === role ? t.you : ""}
                    </span>
                    <span className="ml-auto text-[10px] text-stream-teal border border-stream-teal/30 bg-stream-teal/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t.online}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-stream-ash/20 mt-auto">
                 <Button
                   variant="outline"
                   onClick={handleLeaveRoom}
                   className="w-full text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
                 >
                   <LogOut className="w-4 h-4 mr-2" />
                   {textMap.leaveRoom || "Salir de la sala"}
                 </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - PC */}
        <div className="hidden lg:flex w-64 bg-black/10 border-r border-stream-ash/20 flex-col py-6 px-4">
          <h2 className="text-stream-ash font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-stream-teal animate-pulse" />
            {t.live} ({onlineCount})
          </h2>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {connectedUsers.map((user) => (
             <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-stream-ash/20">
               <div className={`w-3 h-3 rounded-full ${ROLE_COLORS[user.role as Role] || 'bg-stream-ash'} shadow-[0_0_8px_currentColor]`} />
               <span className="font-medium text-sm">{t[`role_${user.role.replace(/\s+/g, '')}`] || user.role} {user.role === role ? t.you : ""}</span>
               <span className="ml-auto text-[10px] text-stream-teal border border-stream-teal/30 bg-stream-teal/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t.online}</span>
             </div>
            ))}
          </div>
          <div className="text-xs text-stream-ash bg-black/20 p-4 rounded-xl mt-4 shrink-0">
            <span className="block mb-2 font-bold text-stream-cream">{t.keyboardShortcuts}</span>
            {quickActions.filter(a => a.shortcut).map((a) => (
              <span key={a.id} className="block mb-1 flex items-center justify-between">
                <span>{getTranslatedText(a.label)}</span>
                <kbd className="bg-black/40 px-1.5 py-0.5 rounded ml-1 text-stream-orange uppercase">{a.shortcut}</kbd>
              </span>
            ))}
            {quickActions.filter(a => a.shortcut).length === 0 && (
              <span className="italic block mt-1">{t.noShortcuts}</span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleLeaveRoom}
            className="w-full text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-400 mt-4 shrink-0"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {textMap.leaveRoom || "Salir de la sala"}
          </Button>
        </div>

        {/* Center - Chat Flow */}
        <div className="flex-1 flex flex-col bg-transparent">
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
                        ? `bg-black/20 border-2 ${MESSAGE_COLORS[msg.actionColor || 'red'].border} ${MESSAGE_COLORS[msg.actionColor || 'red'].text} font-bold` 
                        : 'bg-black/20 border border-stream-ash/30'}
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
          <div className="p-3 sm:p-4 lg:p-6 bg-black/10 border-t border-stream-ash/20">
            <form onSubmit={handleSendMessage} className="flex gap-2 lg:gap-4 max-w-5xl mx-auto w-full">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.typeMessage}
                className="flex-1 rounded-xl sm:rounded-2xl bg-black/40 border border-stream-ash/30 px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg lg:text-2xl outline-none focus:border-stream-orange transition-colors placeholder:text-stream-ash"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!text.trim()}
                className={`h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-20 rounded-xl sm:rounded-2xl shrink-0 ${roleColor} hover:opacity-90 disabled:opacity-50 disabled:bg-stream-dark disabled:border disabled:border-stream-ash/20 text-stream-cream`}
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
              </Button>
            </form>
          </div>
        </div>

        {/* Right - Quick Actions */}
        <div className="hidden lg:flex shrink-0 bg-black/10 lg:w-80 lg:border-l border-stream-ash/20 flex-col p-6 overflow-y-auto">
          <h3 className="text-stream-ash font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-stream-orange" />
            {t.quickActions || "Alertas Rápidas"}
          </h3>
          <MobileQuickActions />
        </div>
      </div>
    </div>
  );
}
