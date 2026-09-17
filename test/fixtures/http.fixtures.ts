import { Request } from "express";
import { generateSession } from "./session.fixtures";

export function generateRequest(): Request {
    return {
        session: generateSession(),
        headers: {},
        params: {},
    } as Request;
}
