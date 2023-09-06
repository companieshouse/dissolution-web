import { StatusCodes } from 'http-status-codes'
import { BaseHttpController } from 'inversify-express-utils'
// import { i18nCh } from '@basilest-ch/ch-node-utils'
// import * as path from 'path' 
// import LocalesConfig from 'app/models/localesConfig'
import LocalesService from "app/services/locales/locales.service"


export default abstract class BaseController<T extends object = {}> extends BaseHttpController {
   // @inject(TYPES.LocalesConfig) private localesConfig: LocalesConfig

  protected async render(template: string, viewModel?: T, status: number = StatusCodes.OK): Promise<string> {
   console.log("----------X2 (BaseController) ------------")

   let data = {}
   Object.assign(data, viewModel)
   console.log(`====5=== [ ${this.httpContext.request.lang} ] ========`)
   console.log(data)
   // console.log(chNodeUtils.Locales.addData((path.join(__dirname, this.LOCALES_CONFIG.path)));
   // console.log(chNodeUtils.languageNames.addTranslations(path.join(__dirname, 'locales')));
   // Object.assign(data, i18nCh.addTranslations(
      // path.join(__dirname, this.LOCALES_CONFIG.path)
      // path.join(__dirname, "../../node_modules/@basilest-ch/ch-locale-dissolution-web/locales"),
      // []

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
