import { useEffect, useRef, useState } from 'react'
import { Box, Button, Heading, Flex, Badge, Text, SimpleGrid, HStack } from '@chakra-ui/react'
import { useSocket } from '../context/SocketContext'
import LiveStatus from '../components/LiveStatus'

export default function AdminPage() {
  const { socket, roomId, connected } = useSocket()
  const [peerMap, setPeerMap] = useState(new Map()) // childId -> { pc, stream }
  const peerMapRef = useRef(new Map())

  const upsertPeer = (childId, entry) => {
    peerMapRef.current.set(childId, entry)
    setPeerMap(new Map(peerMapRef.current))
  }
  const removePeer = (childId) => {
    peerMapRef.current.delete(childId)
    setPeerMap(new Map(peerMapRef.current))
  }
  const [activeChildren, setActiveChildren] = useState([])

  // announce admin role and request active children
  useEffect(() => {
    if (!socket) return
    socket.emit('register-role', 'admin')
    socket.emit('get-active-children')
  }, [socket])

  // track active children list
  useEffect(() => {
    if (!socket) return
    const handleActive = ({ children }) => setActiveChildren(children)
    socket.on('active-children', handleActive)
    return () => socket.off('active-children', handleActive)
  }, [socket])

  // handle offers from any child, create per-child pc
  useEffect(() => {
    if (!socket) return

    const getOrCreatePeer = (childId) => {
      if (peerMapRef.current.has(childId)) return peerMapRef.current.get(childId).pc
      const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      const entry = { pc: peer, stream: null }
      peer.ontrack = (e) => {
        entry.stream = e.streams[0]
        upsertPeer(childId, { ...entry })
      }
      peer.onicecandidate = (e) => {
        if (e.candidate) socket.emit('candidate', { roomId, candidate: e.candidate, to: childId })
      }
      upsertPeer(childId, entry)
      return peer
    }

    const onOffer = async ({ sdp, from }) => {
      const pc = getOrCreatePeer(from)
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('answer', { roomId, sdp: answer, to: from })
    }

    const onCandidate = async ({ candidate, from }) => {
      const entry = peerMapRef.current.get(from)
      if (!entry) return
      try { await entry.pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch { }
    }

    const onChildStopped = ({ childId }) => {
      const entry = peerMapRef.current.get(childId)
      if (entry) {
        entry.pc.close()
        removePeer(childId)
      }
    }

    const onPeerDisconnected = ({ socketId }) => onChildStopped({ childId: socketId })

    socket.on('offer', onOffer)
    socket.on('candidate', onCandidate)
    socket.on('child-stopped', onChildStopped)
    socket.on('peer-disconnected', onPeerDisconnected)

    return () => {
      socket.off('offer', onOffer)
      socket.off('candidate', onCandidate)
      socket.off('child-stopped', onChildStopped)
      socket.off('peer-disconnected', onPeerDisconnected)
    }
  }, [socket, roomId])

  function clearChild(childId) {
    const entry = peerMap.get(childId)
    if (!entry) return
    entry.stream?.getTracks().forEach(t => t.stop())
    entry.pc.close()
    setPeerMap((prev) => { const m = new Map(prev); m.delete(childId); return m })
  }

  useEffect(() => {
    const beforeUnload = () => {
      peerMapRef.current.forEach(({ stream, pc }) => { stream?.getTracks().forEach(t => t.stop()); pc.close() })
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [peerMap])

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="md">Admin: Live View</Heading>
        <Badge colorScheme={connected ? 'green' : 'red'}>{connected ? 'Connected' : 'Disconnected'}</Badge>
      </Flex>
      <Text mb={2}>Room: {roomId}</Text>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {Array.from(peerMap.entries()).map(([childId, entry]) => (
          <Box key={childId} borderWidth="1px" borderRadius="md" p={4}>



         <LiveStatus key={childId} childId={childId}/>

            <video
              autoPlay
              playsInline
              muted
              controls
              autoFocus
              disablePictureInPicture
              disableRemotePlayback
              disableFullscreen
              style={{ width: '100%', background: '#111' }}
              ref={(el) => { if (el && entry.stream && el.srcObject !== entry.stream) el.srcObject = entry.stream }}
            />
            <Button mt={2} size="sm" onClick={() => clearChild(childId)}>Close</Button>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}


