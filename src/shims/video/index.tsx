import {forwardRef, type ReactNode} from 'react'
import {View, type ViewProps} from 'react-native'

type EventSubscription = {
  remove: () => void
}

type VideoPlayerEvents = {
  timeUpdate: {currentTime: number}
  playingChange: {isPlaying: boolean}
  statusChange: {status: string}
}

export class VideoPlayer {
  playing = false
  duration = 0
  currentTime = 0
  loop = false
  muted = false
  timeUpdateEventInterval = 0
  volume = 1

  play() {
    this.playing = true
  }

  pause() {
    this.playing = false
  }

  replace(_source: string | null) {}
  release() {}
  seekBy(seconds: number) {
    this.currentTime += seconds
  }

  addListener<EventName extends keyof VideoPlayerEvents>(
    _eventName: EventName,
    _listener: (event: VideoPlayerEvents[EventName]) => void,
  ): EventSubscription {
    return {remove: () => {}}
  }
}

export function createVideoPlayer(
  _source: string | null,
  setup?: (player: VideoPlayer) => void,
) {
  const player = new VideoPlayer()
  setup?.(player)
  return player
}

export type VideoViewProps = ViewProps & {
  allowsFullscreen?: boolean
  allowsPictureInPicture?: boolean
  children?: ReactNode
  contentFit?: 'contain' | 'cover' | 'fill'
  nativeControls?: boolean
  player: VideoPlayer
}

export const VideoView = forwardRef<View, VideoViewProps>(function VideoView({
  allowsFullscreen,
  allowsPictureInPicture,
  contentFit,
  nativeControls,
  player,
  ...props
}, ref) {
  void allowsFullscreen
  void allowsPictureInPicture
  void contentFit
  void nativeControls
  void player
  return <View ref={ref} {...props} />
})
