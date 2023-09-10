import { StatusCodes } from "http-status-codes"
import { BaseHttpController } from "inversify-express-utils"
import chNodeUtils from "@basilest-ch/ch-node-utils"
import * as path from "path"


export default abstract class BaseController<T extends object = {}> extends BaseHttpController {

  protected async render(template: string, viewModel?: T, status: number = StatusCodes.OK): Promise<string> {
   console.log(`======= [ ${this.httpContext.request.lang}]========`)
   // console.log(chNodeUtils.Locales.addData((path.join(__dirname, this.LOCALES_CONFIG.path)));
   console.log(chNodeUtils.languageNames.addTranslations(path.join(__dirname, "locales")));
    return new Promise<string>((resolve, reject) =>
      this.httpContext.response
        .status(status)
        .render(template, viewModel, (err: Error, html: string) => err ? reject(err) : resolve(html))
    )
  }

}
