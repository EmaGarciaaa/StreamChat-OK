import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";

export const app = express();

// State to track users in rooms
const roomUsers = new Map<string, { id: string, role: string, room: string }[]>();
const roomSettings = new Map<string, any[]>();
const roomPins = new Map<string, string>();
const roomTokens = new Map<string, Set<string>>(); // RoomID -> Set of valid session tokens
const roomMessages = new Map<string, any[]>();
const roomAlerts = new Map<string, any>();

// API route to get occupied roles for a specific room
app.get("/api/room/:roomId/roles", (req, res) => {
  const roomId = req.params.roomId;
  const users = roomUsers.get(roomId) || [];
  const occupiedRoles = users.map(u => u.role);
  res.json({ occupiedRoles });
});

// API route to create a room
app.post("/api/room/create", express.json(), (req, res) => {
  const roomId = Math.random().toString(36).substring(2, 10);
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  roomPins.set(roomId, pin);
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  if (!roomTokens.has(roomId)) roomTokens.set(roomId, new Set());
  roomTokens.get(roomId)!.add(token);
  roomMessages.set(roomId, []); // init history
  res.json({ roomId, pin, token });
});

// API route to verify room PIN
app.post("/api/room/:roomId/verify-pin", express.json(), (req, res) => {
  const roomId = req.params.roomId;
  const { pin } = req.body;
  
  if (!roomPins.has(roomId)) {
    res.status(404).json({ success: false, error: "Sala no encontrada" });
    return;
  }
  
  if (pin === roomPins.get(roomId)) {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    if (!roomTokens.has(roomId)) roomTokens.set(roomId, new Set());
    roomTokens.get(roomId)!.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: "PIN incorrecto" });
  }
});

async function startServer() {
  const PORT = 3000;

  const httpServer = createServer(app);
  
  // Initialize WebSockets for real-time low-latency communication
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  // Handle Socket.io connections
  io.on("connection", (socket) => {
    let currentRoom = "";
    let currentRole = "";
    
    socket.on("join-room", (data) => {
      // Backward compatibility if client only sends room string temporarily during hot reload
      const room = typeof data === 'string' ? data : data.room;
      const role = typeof data === 'string' ? "Desconocido" : data.role;
      const token = typeof data === 'string' ? "" : data.token;
      
      // Validar Token
      if (!roomTokens.has(room) || !roomTokens.get(room)!.has(token)) {
        socket.emit("auth-invalid");
        socket.disconnect();
        return; // Ignorar el join si el token es incorrecto
      }

      socket.data.authenticated = true;
      socket.data.room = room;

      if (currentRoom) {
        socket.leave(currentRoom);
        const users = roomUsers.get(currentRoom) || [];
        const newUsers = users.filter(u => u.id !== socket.id);
        roomUsers.set(currentRoom, newUsers);
        io.to(currentRoom).emit("users-update", newUsers.length);
        io.to(currentRoom).emit("users-list", newUsers);
      }
      currentRoom = room;
      currentRole = role;
      socket.join(room);
      
      const users = roomUsers.get(room) || [];
      
      // Control de roles únicos (Si el rol ya existe en la sala, lo pisa)
      const existingIdx = users.findIndex(u => u.role === role);
      if (existingIdx !== -1) {
        // Enviar evento de "desconexión forzada" al dispositivo anterior (Toma de control)
        io.to(users[existingIdx].id).emit("role-taken");
        users[existingIdx] = { id: socket.id, role, room };
      } else {
        users.push({ id: socket.id, role, room });
      }
      roomUsers.set(room, users);

      io.to(room).emit("users-update", users.length);
      io.to(room).emit("users-list", users);

      if (roomSettings.has(room)) {
        socket.emit("settings-update", roomSettings.get(room));
      }
      
      if (roomMessages.has(room)) {
        socket.emit("sync-history", roomMessages.get(room));
      }
    });

    socket.on("update-settings", (data) => {
      if (!socket.data.authenticated || socket.data.room !== data.room) return;
      roomSettings.set(data.room, data.actions);
      io.to(data.room).emit("settings-update", data.actions);
    });
    
    socket.on("send-message", (data) => {
      if (!socket.data.authenticated || socket.data.room !== data.room) return;
      if (!roomMessages.has(data.room)) roomMessages.set(data.room, []);
      roomMessages.get(data.room)!.push(data);
      // Keep only last 100 messages
      if (roomMessages.get(data.room)!.length > 100) {
        roomMessages.get(data.room)!.shift();
      }
      io.to(data.room).emit("new-message", data);
    });

    socket.on("send-alert", (data) => {
      if (!socket.data.authenticated || socket.data.room !== data.room) return;
      io.to(data.room).emit("flash-alert", data);
    });

    socket.on("disconnect", () => {
      if (currentRoom) {
        const users = roomUsers.get(currentRoom) || [];
        const newUsers = users.filter(u => u.id !== socket.id);
        if (newUsers.length === 0) {
          roomUsers.delete(currentRoom);
        } else {
          roomUsers.set(currentRoom, newUsers);
        }
        io.to(currentRoom).emit("users-update", newUsers.length);
        io.to(currentRoom).emit("users-list", newUsers);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
