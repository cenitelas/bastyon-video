export class Peer {
  peerId: string
  videos: string[] = []
  simultaneous: number
  enable: boolean = true
  stats: {
    cpu: number
    ram: number
    connections: number
  }
}
