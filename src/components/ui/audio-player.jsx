"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { Check, PauseIcon, PlayIcon, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ReadyState = {
  HAVE_NOTHING: 0,
  HAVE_METADATA: 1,
  HAVE_CURRENT_DATA: 2,
  HAVE_FUTURE_DATA: 3,
  HAVE_ENOUGH_DATA: 4,
}

const NetworkState = {
  NETWORK_EMPTY: 0,
  NETWORK_IDLE: 1,
  NETWORK_LOADING: 2,
  NETWORK_NO_SOURCE: 3,
}

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds)) return "00:00"
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const formattedMins = mins < 10 ? `0${mins}` : mins
  const formattedSecs = secs < 10 ? `0${secs}` : secs

  return hrs > 0
    ? `${hrs}:${formattedMins}:${formattedSecs}`
    : `${mins}:${formattedSecs}`
}

const AudioPlayerContext = createContext(null)

export function useAudioPlayer() {
  const api = useContext(AudioPlayerContext)
  if (!api) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider")
  }
  return api
}

const AudioPlayerTimeContext = createContext(null)

export const useAudioPlayerTime = () => {
  const time = useContext(AudioPlayerTimeContext)
  if (time === null) {
    throw new Error("useAudioPlayerTime must be used within an AudioPlayerProvider")
  }
  return time
}

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null)
  const itemRef = useRef(null)
  const playPromiseRef = useRef(null)
  const [readyState, setReadyState] = useState(0)
  const [networkState, setNetworkState] = useState(0)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(undefined)
  const [error, setError] = useState(null)
  const [activeItem, _setActiveItem] = useState(null)
  const [paused, setPaused] = useState(true)
  const [playbackRate, setPlaybackRateState] = useState(1)

  const setActiveItem = useCallback(async (item) => {
    if (!audioRef.current) return
    if (item?.id === itemRef.current?.id) return

    itemRef.current = item
    const currentRate = audioRef.current.playbackRate
    audioRef.current.pause()
    audioRef.current.currentTime = 0

    if (!item) {
      audioRef.current.removeAttribute("src")
    } else {
      audioRef.current.src = item.src
    }

    audioRef.current.load()
    audioRef.current.playbackRate = currentRate
  }, [])

  const play = useCallback(
    async (item) => {
      if (!audioRef.current) return

      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current
        } catch (err) {
          // Play interrupted, safe to ignore
        }
      }

      if (item === undefined || item?.id === activeItem?.id) {
        const playPromise = audioRef.current.play()
        playPromiseRef.current = playPromise
        return playPromise
      }

      itemRef.current = item
      const currentRate = audioRef.current.playbackRate
      if (!audioRef.current.paused) {
        audioRef.current.pause()
      }
      audioRef.current.currentTime = 0

      if (!item) {
        audioRef.current.removeAttribute("src")
      } else {
        audioRef.current.src = item.src
      }

      audioRef.current.load()
      audioRef.current.playbackRate = currentRate
      const playPromise = audioRef.current.play()
      playPromiseRef.current = playPromise
      return playPromise
    },
    [activeItem]
  )

  const pause = useCallback(async () => {
    if (!audioRef.current) return
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current
      } catch (e) {
        // Safe to ignore
      }
    }
    audioRef.current.pause()
    playPromiseRef.current = null
  }, [])

  const seek = useCallback((targetTime) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = targetTime
  }, [])

  const setPlaybackRate = useCallback((rate) => {
    if (!audioRef.current) return
    audioRef.current.playbackRate = rate
    setPlaybackRateState(rate)
  }, [])

  const isItemActive = useCallback(
    (id) => activeItem?.id === id,
    [activeItem]
  )

  useAnimationFrame(() => {
    if (audioRef.current) {
      _setActiveItem(itemRef.current)
      setReadyState(audioRef.current.readyState)
      setNetworkState(audioRef.current.networkState)
      setTime(audioRef.current.currentTime || 0)
      setDuration(audioRef.current.duration)
      setPaused(audioRef.current.paused)
      setError(audioRef.current.error)
      setPlaybackRateState(audioRef.current.playbackRate)
    }
  })

  const isPlaying = !paused
  const isBuffering =
    readyState < ReadyState.HAVE_FUTURE_DATA &&
    networkState === NetworkState.NETWORK_LOADING

  const api = useMemo(
    () => ({
      ref: audioRef,
      duration,
      error,
      isPlaying,
      isBuffering,
      activeItem,
      playbackRate,
      isItemActive,
      setActiveItem,
      play,
      pause,
      seek,
      setPlaybackRate,
    }),
    [
      duration,
      error,
      isPlaying,
      isBuffering,
      activeItem,
      playbackRate,
      isItemActive,
      setActiveItem,
      play,
      pause,
      seek,
      setPlaybackRate,
    ]
  )

  return (
    <AudioPlayerContext.Provider value={api}>
      <AudioPlayerTimeContext.Provider value={time}>
        {/* Removed crossOrigin to fix local audio loading error */}
        <audio ref={audioRef} className="hidden" preload="metadata" />
        {children}
      </AudioPlayerTimeContext.Provider>
    </AudioPlayerContext.Provider>
  )
}

export const AudioPlayerProgress = ({ className, ...otherProps }) => {
  const player = useAudioPlayer()
  const time = useAudioPlayerTime()
  const wasPlayingRef = useRef(false)

  return (
    <SliderPrimitive.Root
      {...otherProps}
      value={[time]}
      onValueChange={(vals) => {
        player.seek(vals[0])
        otherProps.onValueChange?.(vals)
      }}
      min={0}
      max={player.duration || 100}
      step={otherProps.step || 0.25}
      onPointerDown={(e) => {
        wasPlayingRef.current = player.isPlaying
        player.pause()
        otherProps.onPointerDown?.(e)
      }}
      onPointerUp={(e) => {
        if (wasPlayingRef.current) {
          player.play()
        }
        otherProps.onPointerUp?.(e)
      }}
      className={cn(
        "group/player relative flex h-4 touch-none items-center select-none data-[disabled]:opacity-50",
        className
      )}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault()
          if (!player.isPlaying) player.play()
          else player.pause()
        }
        otherProps.onKeyDown?.(e)
      }}
      disabled={
        player.duration === undefined ||
        !Number.isFinite(player.duration) ||
        Number.isNaN(player.duration)
      }
    >
      <SliderPrimitive.Track className="bg-muted relative h-[4px] w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="relative flex h-0 w-0 items-center justify-center opacity-0 group-hover/player:opacity-100 focus-visible:opacity-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        data-slot="slider-thumb"
      >
        <div className="bg-foreground absolute size-3 rounded-full" />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  )
}

export const AudioPlayerTime = ({ className, ...otherProps }) => {
  const time = useAudioPlayerTime()
  return (
    <span
      {...otherProps}
      className={cn("text-muted-foreground text-xs tabular-nums", className)}
    >
      {formatTime(time)}
    </span>
  )
}

export const AudioPlayerDuration = ({ className, ...otherProps }) => {
  const player = useAudioPlayer()
  return (
    <span
      {...otherProps}
      className={cn("text-muted-foreground text-xs tabular-nums", className)}
    >
      {player.duration !== null &&
      player.duration !== undefined &&
      !Number.isNaN(player.duration)
        ? formatTime(player.duration)
        : "--:--"}
    </span>
  )
}

function Spinner({ className }) {
  return (
    <div
      className={cn(
        "border-muted border-t-foreground size-3.5 animate-spin rounded-full border-2",
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

const PlayButton = ({
  playing,
  onPlayingChange,
  className,
  onClick,
  loading,
  ...otherProps
}) => {
  return (
    <Button
      {...otherProps}
      onClick={(e) => {
        onPlayingChange(!playing)
        onClick?.(e)
      }}
      className={cn("relative", className)}
      aria-label={playing ? "Pause" : "Play"}
      type="button"
    >
      {playing ? (
        <PauseIcon className={cn("size-4", loading && "opacity-0")} />
      ) : (
        <PlayIcon className={cn("size-4", loading && "opacity-0")} />
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] backdrop-blur-xs">
          <Spinner />
        </div>
      )}
    </Button>
  )
}

export function AudioPlayerButton({ item, ...otherProps }) {
  const player = useAudioPlayer()

  if (!item) {
    return (
      <PlayButton
        {...otherProps}
        playing={player.isPlaying}
        onPlayingChange={(shouldPlay) => {
          if (shouldPlay) player.play()
          else player.pause()
        }}
        loading={player.isBuffering && player.isPlaying}
      />
    )
  }

  return (
    <PlayButton
      {...otherProps}
      playing={player.isItemActive(item.id) && player.isPlaying}
      onPlayingChange={(shouldPlay) => {
        if (shouldPlay) player.play(item)
        else player.pause()
      }}
      loading={
        player.isItemActive(item.id) && player.isBuffering && player.isPlaying
      }
    />
  )
}

function useAnimationFrame(callback) {
  const requestRef = useRef(null)
  const previousTimeRef = useRef(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== null) {
        const delta = time - previousTimeRef.current
        callbackRef.current(delta)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      previousTimeRef.current = null
    }
  }, [])
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export function AudioPlayerSpeed({
  speeds = PLAYBACK_SPEEDS,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}) {
  const player = useAudioPlayer()
  const currentSpeed = player.playbackRate

  return (
    <DropdownMenu>
      {/* Hydration fix: Avoid rendering <Button> inside trigger button */}
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 w-8",
          className
        )}
        aria-label="Playback speed"
        {...props}
      >
        <Settings className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {speeds.map((speed) => (
          <DropdownMenuItem
            key={speed}
            onClick={() => player.setPlaybackRate(speed)}
            className="flex items-center justify-between"
          >
            <span className={speed === 1 ? "" : "font-mono"}>
              {speed === 1 ? "Normal" : `${speed}x`}
            </span>
            {currentSpeed === speed && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}