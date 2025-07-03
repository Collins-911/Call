import React, { forwardRef, useEffect } from 'react'

const VideoPlayer = forwardRef(({ stream, isLocal }, ref) => {
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream
    }
  }, [stream, ref])

  return (
    <div className={`video-player ${isLocal ? 'local' : 'remote'}`}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={isLocal}
      />
      <div className="video-label">{isLocal ? 'You' : 'Remote'}</div>
    </div>
  )
})

export default VideoPlayer