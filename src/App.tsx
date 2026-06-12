/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Role } from "./types";
import { RoleSelection } from "./components/RoleSelection";
import { ChatDashboard } from "./components/ChatDashboard";
import { AccessGate } from "./components/AccessGate";
import { getTranslation } from "./translations";

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [room, setRoom] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem("streamSync_language") || "es";
  });

  useEffect(() => {
    localStorage.setItem("streamSync_language", language);
  }, [language]);

  useEffect(() => {
    const path = window.location.pathname;
    
    if (path.startsWith("/sala/")) {
      const parsedRoom = path.split("/sala/")[1];
      if (parsedRoom) {
        const token = sessionStorage.getItem(`streamSync_token_${parsedRoom}`);
        if (!token) {
          // Bloqueo de URL directa sin autenticarse
          window.history.replaceState({}, "", "/");
          setAccessDeniedMessage("Acceso Denegado: Se requieren credenciales para esta sala.");
          setIsLoading(false);
          return;
        } else {
          setRoom(parsedRoom);
          setSessionToken(token);
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } else {
        window.history.replaceState({}, "", "/");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleValidAccess = (validRoom: string, token: string) => {
    setRoom(validRoom);
    setSessionToken(token);
    setIsAuthenticated(true);
    window.history.pushState({}, "", `/sala/${validRoom}`);
  };

  const t = getTranslation(language);

  if (isLoading) return <div className="h-screen bg-neutral-950 text-white flex items-center justify-center">{t.loading}</div>;

  if (!isAuthenticated) {
    return <>
      {accessDeniedMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl z-50 animate-in slide-in-from-top-4">
          {accessDeniedMessage}
        </div>
      )}
      <AccessGate onSuccess={handleValidAccess} t={t} />
    </>;
  }

  if (!role) {
    return <RoleSelection onSelectRole={setRole} roomName={room} language={language} setLanguage={setLanguage} t={t} />;
  }

  return <ChatDashboard role={role} roomName={room} language={language} setLanguage={setLanguage} t={t} token={sessionToken} />;
}
