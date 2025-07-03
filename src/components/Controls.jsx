import React from 'react'

const Controls = ({ isMuted, isVideoOff, onHangUp, onToggleMute, onToggleVideo }) => {
  return (
    <div className="controls">
      <button onClick={onToggleMute}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
      <button onClick={onToggleVideo}>
        {isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
      </button>
      <button className="hang-up" onClick={onHangUp}>
        Hang Up
      </button>
    </div>
  )
}

export default Controls