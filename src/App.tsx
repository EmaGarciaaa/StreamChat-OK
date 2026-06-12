/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Role } from "./types";
import { RoleSelection } from "./components/RoleSelection";
import { ChatDashboard } from "./components/ChatDashboard";

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [room, setRoom] = useState<string>("sala-central");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Basic room handling from URL (e.g., /sala/comunidad-stream)
    const path = window.location.pathname;
    if (path.startsWith("/sala/")) {
      const parsedRoom = path.split("/sala/")[1];
      if (parsedRoom) setRoom(parsedRoom);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) return <div className="h-screen bg-neutral-950 text-white flex items-center justify-center">Cargando...</div>;

  if (!role) {
    return <RoleSelection onSelectRole={setRole} roomName={room} />;
  }

  return <ChatDashboard role={role} roomName={room} />;
}
