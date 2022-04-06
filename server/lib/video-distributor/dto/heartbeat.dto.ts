export class HeartbeatDto {
  peerId: string
  removeVideos?: string[] = []
  addVideos?: string[] = []
  stats: {
    cpu: number
    ram: number
    connections: number
  }
}
