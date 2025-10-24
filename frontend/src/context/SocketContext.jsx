import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "https://fbe3adfbbb8c.ngrok-free.app/" || 'http://localhost:4000'
  const defaultRoomId = import.meta.env.VITE_DEFAULT_ROOM_ID || 'family-room-1'

  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [roomId, setRoomId] = useState(defaultRoomId)

  useEffect(() => {
try {
      const socket = io(serverUrl, { withCredentials: true, transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    // if (!socket.connected) return alert('Could not connect to signaling server')

    // default: unknown until pages set role explicitly if needed
    socket.emit('join', { roomId })
      return () => {
      socket.disconnect()
    }

} catch (error) {
      console.error('Socket connection error:', error)
      alert('Could not connect to signaling server: ' + error.message)
  
}
  
  }, [serverUrl, roomId])

  const value = useMemo(() => ({
    socket: socketRef.current,
    connected,
    roomId,
    setRoomId,
  }), [connected, roomId])

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}


