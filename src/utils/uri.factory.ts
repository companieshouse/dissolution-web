import { Request } from "express";
import { provide } from "inversify-binding-decorators";

@provide(UriFactory)
export default class UriFactory {
    public createAbsoluteUri (req: Request, path: string): string {
        return new URL(path, `${req.protocol}://${req.headers.host}`).href;
    }
}
