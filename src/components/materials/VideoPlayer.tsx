import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VideoPlayer({
  src,
  poster,
  onFirstPlay,
}: {
  src: string
  poster?: string | null
  /** Chamado uma única vez, na primeira vez que o vídeo começa a tocar (usado pra marcar "visto"). */
  onFirstPlay?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const firedRef = useRef(false)

  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => setCurrentTime(video.currentTime)
    const onLoadedMetadata = () => setDuration(video.duration)
    const onPlay = () => {
      setPlaying(true)
      if (!firedRef.current) {
        firedRef.current = true
        onFirstPlay?.()
      }
    }
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Number(e.target.value)
    setCurrentTime(video.currentTime)
  }

  function toggleFullscreen() {
    containerRef.current?.requestFullscreen?.()
  }

  return (
    <div ref={containerRef} className="group relative w-full overflow-hidden rounded-2xl bg-slate-900">
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        className="aspect-video w-full"
        onClick={togglePlay}
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-slate-900/90 to-transparent p-3 pt-8">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={seek}
          className="h-1 w-full cursor-pointer accent-brand-500"
        />
        <div className="flex items-center gap-3 text-white">
          <button type="button" onClick={togglePlay} className="cursor-pointer">
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button type="button" onClick={toggleMute} className="cursor-pointer">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <span className="text-xs tabular-nums text-white/80">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button type="button" onClick={toggleFullscreen} className="ml-auto cursor-pointer">
            <Maximize size={18} />
          </button>
        </div>
      </div>

      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Reproduzir"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-lg">
            <Play size={28} className="ml-1" />
          </span>
        </button>
      )}
    </div>
  )
}
