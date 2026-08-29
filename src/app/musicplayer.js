"use client"

import { PauseIcon, PlayIcon, ListMusic } from "lucide-react"

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

export function AudioPlayer() {
  return (
    <AudioPlayerProvider>
      <AudioPlayerDemo />
    </AudioPlayerProvider>
  )
}

const tracks = [
  {
    id: "track-1",
    name: "Snowman",
    src: "/music/Snowman.mp3",
    data: { title: "Snowman", artist: "WYS" },
  },
  {
    id: "track-2",
    name: "Special",
    src: "/music/SpecialSong.mp3",
    data: { title: "SpecialSong", artist: "RA" },
  },
]

export const AudioPlayerDemo = () => {
  return (
    <Card className="w-full h-full flex flex-col justify-center p-4">
      {/* Mini Player Section */}
      <Player />

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
                Choose a track to play. Audio will continue in the background.
              </DialogDescription>
            </DialogHeader>

            {/* Added max-w-full min-w-0 */}
            <ScrollArea className="h-64 w-full max-w-full min-w-0 pr-3 mt-2">
              <div className="flex flex-col gap-1 w-full min-w-0 max-w-full">
                {tracks.map((song, index) => (
                  <SongListItem
                    key={song.id}
                    song={song}
                    trackNumber={index + 1}
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

const Player = () => {
  const player = useAudioPlayer()

  return (
    <div className="w-full min-w-0">
      <div className="mb-2 min-w-0">
        <h3 className="text-sm font-semibold truncate">
          {player.activeItem?.data?.title ?? "No track selected"}
        </h3>
        {player.activeItem?.data?.artist && (
          <p className="text-xs text-muted-foreground truncate">
            {player.activeItem.data.artist}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <AudioPlayerButton
          variant="outline"
          size="default"
          className="h-10 w-10 shrink-0"
          disabled={!player.activeItem}
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

const SongListItem = ({ song, trackNumber }) => {
  const player = useAudioPlayer()
  const isActive = player.isItemActive(song.id)
  const isCurrentlyPlaying = isActive && player.isPlaying

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      className={cn(
        "h-10 w-full max-w-full min-w-0 justify-start px-3 font-normal",
        isActive && "bg-secondary"
      )}
      onClick={() => {
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
        {/* Play/Pause Icon */}
        <div className="flex w-4 shrink-0 items-center justify-center">
          {isCurrentlyPlaying ? (
            <PauseIcon className="size-4" />
          ) : (
            <PlayIcon className="size-4" />
          )}
        </div>

        {/* Truncated Track Title showing '...' */}
        <span className="truncate text-left text-sm flex-1 min-w-0">
          {song.name}
        </span>

        {/* Optional Artist Name */}
        {song.data?.artist && (
          <span className="text-xs text-muted-foreground shrink-0 pl-2">
            {song.data.artist}
          </span>
        )}
      </div>
    </Button>
  )
}