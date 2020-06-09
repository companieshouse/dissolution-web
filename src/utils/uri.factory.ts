import { Request } from 'express'

export class UriFactory {
  public createAbsoluteUri(req: Request, path: string): string {
    return new URL(path, `${req.protocol}://${req.headers.host}`).href
  }
}
