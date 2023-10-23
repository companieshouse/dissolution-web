import { StatusCodes } from "http-status-codes"
import { BaseHttpController } from "inversify-express-utils"
import { LocalesService, QUERY_PAR_LANG } from "@companieshouse/ch-node-utils"

export default abstract class BaseController<T extends object = {}> extends BaseHttpController {

    protected async render (template: string, viewModel?: T, status: number = StatusCodes.OK): Promise<string> {
        const lang = <string> this.httpContext.request.lang
        const data = {}
        Object.assign(data, viewModel)
        Object.assign(data, LocalesService.getInstance().i18nCh.resolveNamespacesKeys(
            lang,
            data
        ),
        {
            lang: lang,
            langInSession: this.httpContext.request.session?.getExtraData<string>(QUERY_PAR_LANG),
            checkTilt: "1"
        }
        )
        return new Promise<string>((resolve, reject) =>
            this.httpContext.response
                .status(status)
                .render(template, data, (err: Error, html: string) => err ? reject(err) : resolve(html))
        )
    }
}
