"use client"

import { PauseIcon, PlayIcon, ListMusic, Lock } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerSpeed,
  AudioPlayerTime,
  useAudioPlayer,
} from "@/components/ui/audio-player"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { TRACKS } from "@/lib/rewards"

export function AudioPlayer({ userLevel = 1 }) {
  return (
    <AudioPlayerProvider>
      <AudioPlayerDemo userLevel={userLevel} />
    </AudioPlayerProvider>
  )
}

export const AudioPlayerDemo = ({ userLevel = 1 }) => {
  return (
    <Card className="w-full h-full flex flex-col justify-center p-4 bg-white/90 dark:bg-zinc-900/90">
      {/* Mini Player Section */}
      <Player userLevel={userLevel} />

      {/* Dialog for selecting tracks */}
      <div className="mt-3 flex justify-end">
        <Dialog>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2">
                <ListMusic className="size-4" />
                Select Tracks
              </Button>
            }
          />

          <DialogContent className="sm:max-w-md w-full overflow-hidden">
            <DialogHeader>
              <DialogTitle>Track Library</DialogTitle>
              <DialogDescription>
                Lofi, ASMR and beats to help you focus.
              </DialogDescription>
            </DialogHeader>

            {/* Added max-w-full min-w-0 */}
            <ScrollArea className="h-64 w-full max-w-full min-w-0 pr-3 mt-2">
              <div className="flex flex-col gap-1 w-full min-w-0 max-w-full">
                {TRACKS.map((song, index) => (
                  <SongListItem
                    key={song.id}
                    song={song}
                    trackNumber={index + 1}
                    userLevel={userLevel}
                  />
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  )
}

const Player = ({ userLevel = 1 }) => {
  const player = useAudioPlayer()
  const activeTrack = TRACKS.find((t) => t.id === player.activeItem?.id)
  const isLocked = activeTrack && (activeTrack.minLevel || 1) > userLevel

  return (
    <div className="w-full min-w-0">
      <div className="mb-2 min-w-0">
        <h3 className="text-sm font-semibold truncate flex items-center gap-1.5">
          {player.activeItem?.data?.title ?? "No track selected"}
          {isLocked && <Lock className="size-3.5 text-muted-foreground shrink-0 inline" />}
        </h3>
        {isLocked ? (
          <p className="text-xs text-amber-500 font-medium">
            will unlock at Level {activeTrack.minLevel}
          </p>
        ) : (
          player.activeItem?.data?.artist && (
            <p className="text-xs text-muted-foreground truncate">
              {player.activeItem.data.artist}
            </p>
          )
        )}
      </div>

      <div className="flex items-center gap ">
        <AudioPlayerButton
          variant="outline"
          size="default"
          className="h-10 w-10 shrink-0"
          disabled={!player.activeItem || isLocked}
        />
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <AudioPlayerTime className="text-xs tabular-nums shrink-0" />
          <AudioPlayerProgress className="flex-1 min-w-0" />
          <AudioPlayerDuration className="text-xs tabular-nums shrink-0" />
          <AudioPlayerSpeed variant="ghost" size="icon" className="shrink-0" />
        </div>
      </div>
    </div>
  )
}

const SongListItem = ({ song, trackNumber, userLevel = 1 }) => {
  const player = useAudioPlayer()
  const isActive = player.isItemActive(song.id)
  const isCurrentlyPlaying = isActive && player.isPlaying
  const isLocked = (song.minLevel || 1) > userLevel

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      disabled={isLocked}
      className={cn(
        "h-10 w-full max-w-full min-w-0 justify-start px-3 font-normal transition-all",
        isActive && "bg-secondary",
        isLocked && "opacity-50 cursor-not-allowed bg-muted/20 hover:bg-muted/20 text-muted-foreground select-none"
      )}
      onClick={() => {
        if (isLocked) return
        if (isCurrentlyPlaying) {
          player.pause()
        } else {
          player.play({
            id: song.id,
            src: song.src,
            data: song.data,
          })
        }
      }}
    >
      <div className="flex w-full min-w-0 items-center gap-3">
        {/* Play/Pause/Lock Icon */}
        <div className="flex w-4 shrink-0 items-center justify-center">
          {isLocked ? (
            <Lock className="size-3.5 text-muted-foreground shrink-0" />
          ) : isCurrentlyPlaying ? (
            <PauseIcon className="size-4" />
          ) : (
            <PlayIcon className="size-4" />
          )}
        </div>

        {/* Truncated Track Title showing '...' */}
        <span className={cn("truncate text-left text-sm flex-1 min-w-0", isLocked && "text-muted-foreground")}>
          {song.name}
        </span>

        {/* Locked state label or Artist Name */}
        {isLocked ? (
          <span className="text-[11px] text-muted-foreground shrink-0 pl-2 font-medium">
            will unlock at Level {song.minLevel}
          </span>
        ) : (
          song.data?.artist && (
            <span className="text-xs text-muted-foreground shrink-0 pl-2">
              {song.data.artist}
            </span>
          )
        )}
      </div>
    </Button>
  )
}