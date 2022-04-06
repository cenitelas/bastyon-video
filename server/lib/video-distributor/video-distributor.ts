import { Server as HTTPServer } from "http"
import { Server as SocketServer, Socket } from "socket.io"
import { RedisClient } from "redis"
import { Peer } from "@server/lib/video-distributor/models/peer"
import { PeerRegistrationDto } from "@server/lib/video-distributor/dto/peer-registration.dto"
import { Response } from "@server/lib/video-distributor/models/response"
import { HeartbeatDto } from "@server/lib/video-distributor/dto/heartbeat.dto"
import { VideosUpdateDto } from "@server/lib/video-distributor/dto/videos-update.dto"
import { FarewellDto } from "@server/lib/video-distributor/dto/farewell.dto"

enum VideoDistributorEvents{
  PEER_REGISTRATION = "peer-registration",
  HEARTBEAT = "heartbeat",
  VIDEOS_UPDATE = "videos-update",
  FAREWELL = "farewell"
}

class VideoDistributor {
  private static instance: VideoDistributor
  private constructor () {}
  private client: RedisClient

  static get Instance () {
    return this.instance || (this.instance = new this())
  }

  init = (server: HTTPServer, client: RedisClient) => {
    this.client = client
    const io = new SocketServer(server)
    io.on("connection", (socket) => {
      this.registerPeer(socket)
      this.videosUpdate(socket)
      this.heartbeat(socket)
      this.farewell(socket)
      this.disconnectPeer(socket)
    })
  }

  addPeer = async (sessionId: string, peer: Peer) => {
    return new Promise((resolve, reject) => {
      this.client.set(`distributor:${sessionId}`, JSON.stringify(peer), err => {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    })
  }

  removePeer = async (sessionId: string) => {
    return new Promise((resolve, reject) => {
      this.client.del(`distributor:${sessionId}`, null, err => {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    })
  }

  getPeerBySessionId = async (sessionId: string): Promise<Peer> => {
    return new Promise((resolve, reject) => {
      this.client.get(`distributor:${sessionId}`, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(JSON.parse(data))
        }
      })
    })
  }

  disconnectPeer= (socket: Socket) => {
    socket.on('disconnect', async () => {
      await this.removePeer(socket.id)
    })
  }

  registerPeer = (socket: Socket) => {
    socket.on(VideoDistributorEvents.PEER_REGISTRATION, async (data: PeerRegistrationDto) => {
      try {
        const peer: Peer = new Peer()
        peer.peerId = data.peerId
        peer.videos = data.videos
        if (peer?.videos?.length) {
          for (const videoId of peer?.videos) {
            await socket.join(`distributor:${videoId}`)
          }
        }
        await this.addPeer(socket.id, peer)
        return new Response({
          action: VideoDistributorEvents.PEER_REGISTRATION,
          success: true
        })
      } catch (e) {
        return new Response({
          action: VideoDistributorEvents.PEER_REGISTRATION,
          success: false,
          error: {
            message: e?.message,
            data: e
          }
        })
      }
    })
  }

  heartbeat = (socket: Socket) => {
    socket.on(VideoDistributorEvents.HEARTBEAT, async (data: HeartbeatDto) => {
      try {
        const peer = await this.getPeerBySessionId(socket.id)
        peer.videos = peer.videos.filter(el => !data.removeVideos?.some(item => item === el) ?? true)
        peer.videos = [ ...peer.videos, ...data.addVideos || [] ]
        if (peer?.videos?.length) {
          for (const videoId of peer?.videos) {
            await socket.join(`distributor:${videoId}`)
          }
        }
        peer.stats = data.stats
        await this.addPeer(socket.id, peer)
        return new Response({
          action: VideoDistributorEvents.HEARTBEAT,
          success: true
        })
      } catch (e) {
        return new Response({
          action: VideoDistributorEvents.HEARTBEAT,
          success: false,
          error: {
            message: e?.message,
            data: e
          }
        })
      }
    })
  }

  videosUpdate = (socket: Socket) => {
    socket.on(VideoDistributorEvents.VIDEOS_UPDATE, async (data: VideosUpdateDto) => {
      try {
        const peer = await this.getPeerBySessionId(socket.id)
        peer.videos = peer.videos.filter(el => !data.removeVideos?.some(item => item === el) ?? true)
        peer.videos = [ ...peer.videos, ...data.addVideos || [] ]
        if (peer?.videos?.length) {
          for (const videoId of peer?.videos) {
            await socket.join(`distributor:${videoId}`)
          }
        }
        await this.addPeer(socket.id, peer)
        return new Response({
          action: VideoDistributorEvents.VIDEOS_UPDATE,
          success: true
        })
      } catch (e) {
        return new Response({
          action: VideoDistributorEvents.VIDEOS_UPDATE,
          success: false,
          error: {
            message: e?.message,
            data: e
          }
        })
      }
    })
  }

  farewell = (socket: Socket) => {
    socket.on(VideoDistributorEvents.FAREWELL, async (data: FarewellDto) => {
      try {
        const peer = await this.getPeerBySessionId(socket.id)

        await this.addPeer(socket.id, peer)
        return new Response({
          action: VideoDistributorEvents.FAREWELL,
          success: true
        })
      } catch (e) {
        return new Response({
          action: VideoDistributorEvents.FAREWELL,
          success: false,
          error: {
            message: e?.message,
            data: e
          }
        })
      }
    })
  }

}

export {
  VideoDistributor
}
