import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const serverUrl =
    import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:4000";
  const defaultRoomId = import.meta.env.VITE_DEFAULT_ROOM_ID || "family-room-1";

  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState(defaultRoomId);

  useEffect(() => {
    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      alert("Disconnected from signaling server");
    });

    // Catch connection errors
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      alert("Could not connect to signaling server: " + err.message);
    });

    socket.on("connect_failed", (err) => {
      console.error("Socket connection failed:", err);
      alert("Could not connect to signaling server");
    });

    // Join room after connecting
    socket.emit("join", { roomId });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl, roomId]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      roomId,
      setRoomId,
    }),
    [connected, roomId]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
