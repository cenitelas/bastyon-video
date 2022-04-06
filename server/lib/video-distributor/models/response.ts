export class Response {
  public constructor (init?: Partial<Response>) {
    Object.assign(this, init)
  }

  action: string
  success?: boolean
  error?: {
    message: string
    data?: object
  }
}
