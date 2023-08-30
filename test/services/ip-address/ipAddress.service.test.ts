import { assert } from "chai"
import { Request } from "express"
import { generateRequest } from "../../fixtures/http.fixtures"

import IpAddressService from "app/services/ip-address/ipAddress.service"

describe("IpAddressService", () => {
    const service: IpAddressService = new IpAddressService()

    const IP_ADDRESS = "127.0.0.1"

    describe("getIpAddress", () => {

        it("should respond with the IP address from the provided request", () => {
            const req: Request = generateRequest()
            req.headers = { "x-forwarded-for": IP_ADDRESS }

            const ip = service.getIpAddress(req)

            assert.equal(ip, IP_ADDRESS)
        })
    })
})
