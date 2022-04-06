export class VideosUpdateDto {
  peerId: string
  removeVideos?: string[] = []
  addVideos?: string[] = []
}
