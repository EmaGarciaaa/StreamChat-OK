import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { MessagePayload, AlertPayload, QuickAction } from "../types";
import { getBackendUrl } from "../utils/config";

const SOCKET_SERVER_URL = getBackendUrl();

export function useSocket(room: string, role: string, soundEnabled: boolean = false, token: string = "") {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState<{id: string, role: string}[]>([]);
  const [alert, setAlert] = useState<AlertPayload | null>(null);
  const [sharedActions, setSharedActions] = useState<QuickAction[] | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const playAudioCue = useCallback((isAlert = false) => {
    if (!soundEnabledRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (isAlert) {
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1); 
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  }, []);

  useEffect(() => {
    if (!room || !role || !token) return;

    const newSocket = io(SOCKET_SERVER_URL);
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      newSocket.emit("join-room", { room, role, token });
      setSocket(newSocket);
    });

    newSocket.on("auth-invalid", () => {
      window.alert("Sesión inválida para la sala. Acceso Denegado.");
      sessionStorage.removeItem(`streamSync_token_${room}`);
      window.location.href = "/";
    });

    newSocket.on("sync-history", (history: MessagePayload[]) => {
      setMessages(history);
    });

    newSocket.on("users-update", (count: number) => {
      setOnlineCount(count);
    });

    newSocket.on("users-list", (users: {id: string, role: string}[]) => {
      setConnectedUsers(users);
    });

    newSocket.on("role-taken", () => {
      alert("Alguien más ha ingresado con tu rol. Refrescando...");
      window.location.reload();
    });

    newSocket.on("new-message", (msg: MessagePayload) => {
      setMessages((prev) => {
        // Idempotency: avoid duplicates
        if (prev.some((m) => m.id === msg.id)) return prev;
        // Keep last 100 messages
        return [...prev, msg].slice(-100);
      });
      playAudioCue();
    });

    newSocket.on("settings-update", (actions: QuickAction[]) => {
      setSharedActions(actions);
    });

    newSocket.on("flash-alert", (alertPayload: AlertPayload) => {
      setAlert(alertPayload);
      playAudioCue(true);
      setTimeout(() => setAlert(null), 1500);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [room, playAudioCue]);

  const sendMessage = useCallback((msg: Omit<MessagePayload, "room">) => {
    if (socketRef.current) {
      socketRef.current.emit("send-message", { ...msg, room });
    }
  }, [room]);

  const sendAlert = useCallback((alertPayload: Omit<AlertPayload, "room">) => {
    if (socketRef.current) {
      socketRef.current.emit("send-alert", { ...alertPayload, room });
    }
  }, [room]);

  const updateSharedSettings = useCallback((actions: QuickAction[]) => {
    if (socketRef.current) {
      socketRef.current.emit("update-settings", { room, actions });
    }
  }, [room]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  return { messages, onlineCount, connectedUsers, alert, sharedActions, sendMessage, sendAlert, updateSharedSettings, disconnect };
}
