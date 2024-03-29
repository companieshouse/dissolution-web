import "reflect-metadata"

import { Request } from "express"
import { provide } from "inversify-binding-decorators"

@provide(IpAddressService)
export default class IpAddressService {

    public getIpAddress (req: Request): string {
        const forwardedIpsStr: string = req.headers["x-forwarded-for"] as string
        return forwardedIpsStr.split(",")[0]
    }
}
