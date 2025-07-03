import React, { useEffect, useRef, useState } from 'react';
import { Peer } from 'peerjs';

export default function App() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peer = useRef(null);

  useEffect(() => {
    peer.current = new Peer(undefined, {
      host: 'peerjs.com',
      port: 443,
      secure: true,
      path: '/',
      debug: 3
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera/microphone. Please check permissions.');
      });

    peer.current.on('open', (id) => {
      setPeerId(id);
    });

    peer.current.on('call', (call) => {
      setConnectionStatus('Incoming call...');
      call.answer(localStream);
      call.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setConnectionStatus('Connected');
      });
      call.on('error', (error) => {
        console.error('Call error:', error);
        setConnectionStatus('Call failed');
      });
      call.on('close', () => {
        setConnectionStatus('Call ended');
        setRemoteStream(null);
      });
    });

    peer.current.on('error', (error) => {
      console.error('PeerJS error:', error);
      setConnectionStatus('Error: ' + error.message);
    });

    return () => {
      if (peer.current) {
        peer.current.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const callPeer = () => {
    if (!remotePeerId.trim()) {
      alert('Please enter a remote peer ID');
      return;
    }

    if (!localStream) {
      alert('Local stream not ready yet');
      return;
    }

    setConnectionStatus('Calling...');
    const call = peer.current.call(remotePeerId, localStream);

    call.on('stream', (stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setConnectionStatus('Connected');
    });

    call.on('error', (error) => {
      console.error('Call error:', error);
      setConnectionStatus('Call failed');
    });

    call.on('close', () => {
      setConnectionStatus('Call ended');
      setRemoteStream(null);
    });
  };

  const endCall = () => {
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    setConnectionStatus('Disconnected');
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#0f172a', color: '#fff', minHeight: '100vh' }}>
      <h2>🎥 PeerJS Video Call</h2>
      <p>Your Peer ID: <strong>{peerId}</strong></p>
      <p>Status: <strong>{connectionStatus}</strong></p>

      <div style={{ margin: '20px 0' }}>
        <input
          type="text"
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
          placeholder="Enter remote peer ID"
          style={{ padding: '10px', width: '240px', borderRadius: '8px', marginRight: '10px', border: 'none' }}
        />
        <button onClick={callPeer} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#38bdf8', color: '#000', borderRadius: '8px', cursor: 'pointer' }}>
          Call
        </button>
        <button onClick={endCall} style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
          End Call
        </button>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
        <div>
          <h4>Local Video</h4>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '320px',
              height: '240px',
              backgroundColor: '#1e293b',
              borderRadius: '10px',
              border: '2px solid #334155'
            }}
          />
        </div>

        <div>
          <h4>Remote Video</h4>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '320px',
              height: '240px',
              backgroundColor: '#1e293b',
              borderRadius: '10px',
              border: '2px solid #334155'
            }}
          />
        </div>
      </div>
    </div>
  );
}
