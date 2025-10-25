import { useEffect, useRef, useState } from 'react'
import { Box, Button, Heading, Text, Flex, Badge } from '@chakra-ui/react'
import { useSocket } from '../context/SocketContext'

export default function ChildPage() {
  const { socket, roomId, connected } = useSocket()
  const [sharing, setSharing] = useState(false)
  const [pc, setPc] = useState(null)
  const localStreamRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && localStreamRef.current) {
      videoRef.current.srcObject = localStreamRef.current
    }
  }, [localStreamRef.current])

async function startShare() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
    if (!stream) return alert('Could not get display media')
    localStreamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream

    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    setPc(peer)

    stream.getTracks().forEach((track) => peer.addTrack(track, stream))

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        try {
          socket?.emit('candidate', { roomId, candidate: e.candidate })
        } catch (err) {
          console.error('Error sending ICE candidate:', err)
          alert('Error sending ICE candidate: ' + err.message)
        }
      }
    }

    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)

    try {
      socket?.emit('offer', { roomId, sdp: offer })
    } catch (err) {
      console.error('Error sending offer:', err)
      alert('Error sending offer: ' + err.message)
    }

    socket?.once('answer', async ({ sdp }) => {
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp))
      } catch (err) {
        console.error('Error setting remote description:', err)
        alert('Error setting remote description: ' + err.message)
      }
    })

    socket?.on('candidate', async ({ candidate }) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error('Error adding ICE candidate:', err)
        alert('Error adding ICE candidate: ' + err.message)
      }
    })

    stream.getVideoTracks()[0]?.addEventListener('ended', () => stopShare())

    setSharing(true)
  } catch (err) {
    console.error('Error starting screen share:', err)
    alert('Could not start screen sharing: ' + err.message)
  }
}


  function stopShare() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    pc?.getSenders().forEach((s) => pc.removeTrack(s))
    pc?.close()
    setPc(null)
    setSharing(false)
    socket?.emit('stop-share')
  }

  useEffect(() => {
    const beforeUnload = () => {
      stopShare()
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [pc])

useEffect(() => {
  if (!socket) return

  const handleRequestOffer = async ({ to, roomId: rid }) => {
    try {
      if (!sharing || !pc) return

      // Create a fresh offer for the requesting admin
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      try {
        socket.emit('offer', { roomId: rid || roomId, sdp: offer, to })
      } catch (err) {
        console.error('Error sending offer via socket:', err)
        alert('Error sending offer: ' + err.message)
      }

    } catch (err) {
      console.error('Error creating or setting offer:', err)
      alert('Error handling request-offer: ' + err.message)
    }
  }

  socket.on('request-offer', handleRequestOffer)

  return () => socket.off('request-offer', handleRequestOffer)
}, [socket, pc, sharing, roomId])


  return (
    <Box>
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="md">Child: Share Screen</Heading>
        <Badge colorScheme={connected ? 'green' : 'red'}>{connected ? 'Connected' : 'Disconnected'}</Badge>
      </Flex>
      <Text mb={2}>Room: {roomId}</Text>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', background: '#111' }} />
      <Flex mt={4} gap={3}>
        <Button colorScheme="blue" onClick={startShare} isDisabled={!connected || sharing}>Start Screen Share</Button>
        <Button variant="outline" onClick={stopShare} isDisabled={!sharing}>Stop</Button>
      </Flex>
      {sharing && (
        <Text mt={2} color="green.600">Sharing Active</Text>
      )}
    </Box>
  )
}


