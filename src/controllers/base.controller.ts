import { StatusCodes } from 'http-status-codes'
import { BaseHttpController } from 'inversify-express-utils'
import LocalesService from "app/services/locales/locales.service"

export default abstract class BaseController<T extends object = {}> extends BaseHttpController {

  protected async render(template: string, viewModel?: T, status: number = StatusCodes.OK): Promise<string> {
   console.log("----------X2 (BaseController) ------------")

   let data = {}
   Object.assign(data, viewModel)
   console.log(`====5=== [ ${this.httpContext.request.lang} ] ========`)
   console.log(data)

   Object.assign(data, LocalesService.getInstance().i18nCh.resolveNamespacesKeys(
      this.httpContext.request.lang!,
      data
   ));
   console.log("===========>")
   console.log(data)
    return new Promise<string>((resolve, reject) =>
      this.httpContext.response
        .status(status)
        .render(template, data, (err: Error, html: string) => err ? reject(err) : resolve(html))
    )
  }
}
