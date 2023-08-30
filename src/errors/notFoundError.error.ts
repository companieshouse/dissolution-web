import { StatusCodes } from "http-status-codes"
import { FrontendError } from "./frontendError.error"

export class NotFoundError extends FrontendError {
    constructor (message: string) {
        super("Not Found Request", StatusCodes.NOT_FOUND)
        this.message = message
    }
}
