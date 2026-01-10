"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

// Define the context shape
const SocketContext = createContext<Socket | null>(null);

// Custom hook to use the socket easily in other components
export const useSocket = () => {
  return useContext(SocketContext);
};

// The Provider component that wraps your app
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to your Backend URL (ensure port matches your server, usually 5000)
    const newSocket = io("http://localhost:5000");

    setSocket(newSocket);

    // Cleanup connection when app closes
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};