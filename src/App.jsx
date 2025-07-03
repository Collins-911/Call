import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import VideoPlayer from './components/VideoPlayer'
import Controls from './components/Controls'
import './styles.css'

const socket = io('https://your-signaling-server.onrender.com');

function App() {
  const [roomId, setRoomId] = useState('')
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const peerConnection = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  const servers = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
      }
    ]
  }

  useEffect(() => {
    // Set up socket listeners
    socket.on('roomCreated', (room) => {
      console.log('Room created:', room)
      setRoomId(room)
    })

    socket.on('roomJoined', (room) => {
      console.log('Joined room:', room)
      setRoomId(room)
      createOffer()
    })

    socket.on('offer', async (offer) => {
      if (!isCallActive) {
        await createAnswer(offer)
      }
    })

    socket.on('answer', async (answer) => {
      await peerConnection.current.setRemoteDescription(answer)
    })

    socket.on('ice-candidate', async (candidate) => {
      try {
        await peerConnection.current.addIceCandidate(candidate)
      } catch (error) {
        console.error('Error adding ICE candidate:', error)
      }
    })

    return () => {
      socket.off('roomCreated')
      socket.off('roomJoined')
      socket.off('offer')
      socket.off('answer')
      socket.off('ice-candidate')
    }
  }, [isCallActive])

  const setupPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection(servers)

    // Add local stream to peer connection
    localStream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, localStream)
    })

    // Set up event handlers for peer connection
    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
        setRemoteStream(event.streams[0])
      }
    }

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, roomId })
      }
    }

    peerConnection.current.oniceconnectionstatechange = () => {
      if (peerConnection.current.iceConnectionState === 'disconnected') {
        handleHangUp()
      }
    }
  }

  const createRoom = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      socket.emit('createRoom')
      setupPeerConnection()
      setIsCallActive(true)
    } catch (error) {
      console.error('Error accessing media devices:', error)
    }
  }

  const joinRoom = async () => {
    if (!roomId) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      socket.emit('joinRoom', roomId)
      setupPeerConnection()
      setIsCallActive(true)
    } catch (error) {
      console.error('Error accessing media devices:', error)
    }
  }

  const createOffer = async () => {
    try {
      const offer = await peerConnection.current.createOffer()
      await peerConnection.current.setLocalDescription(offer)
      socket.emit('offer', { offer, roomId })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  const createAnswer = async (offer) => {
    try {
      await peerConnection.current.setRemoteDescription(offer)
      const answer = await peerConnection.current.createAnswer()
      await peerConnection.current.setLocalDescription(answer)
      socket.emit('answer', { answer, roomId })
    } catch (error) {
      console.error('Error creating answer:', error)
    }
  }

  const handleHangUp = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnection.current) {
      peerConnection.current.close()
    }
    setLocalStream(null)
    setRemoteStream(null)
    setIsCallActive(false)
    setRoomId('')
    socket.emit('leaveRoom', roomId)
  }

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  return (
    <div className="app">
      <h1>Video Chat App</h1>
      
      {!isCallActive ? (
        <div className="setup">
          <button onClick={createRoom}>Create Room</button>
          <div className="join-room">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button onClick={joinRoom}>Join Room</button>
          </div>
        </div>
      ) : (
        <div className="call-container">
          <div className="video-container">
            <VideoPlayer stream={localStream} isLocal={true} ref={localVideoRef} />
            <VideoPlayer stream={remoteStream} isLocal={false} ref={remoteVideoRef} />
          </div>
          <Controls
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            onHangUp={handleHangUp}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
          />
          <div className="room-id">Room ID: {roomId}</div>
        </div>
      )}
    </div>
  )
}

export default App