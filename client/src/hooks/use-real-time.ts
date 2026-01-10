import { useEffect } from "react";
import { useSocket } from "@/context/socket-provider";

export const useRealTime = (event: string, callback: () => void) => {
  const socket = useSocket();

  useEffect(() => {
    // 1. Check if socket object exists
    if (!socket) {
      console.warn("⚠️ useRealTime: No socket instance found. Is SocketProvider wrapping App?");
      return;
    }

    // 2. Check if actually connected to server
    if (!socket.connected) {
      console.log("⏳ Socket initializing... (Current state: disconnected)");
    }

    const onConnect = () => {
      console.log("✅ Socket Connected to Server!");
    };

    const handleEvent = (data: any) => {
      console.log(`🔔 REAL-TIME EVENT RECEIVED: "${event}"`, data);
      callback(); // This triggers fetchData()
    };

    // Listeners
    socket.on("connect", onConnect);
    socket.on(event, handleEvent);

    return () => {
      socket.off("connect", onConnect);
      socket.off(event, handleEvent);
    };
  }, [socket, event, callback]);
};