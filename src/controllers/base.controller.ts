import { StatusCodes } from 'http-status-codes'
import { BaseHttpController } from 'inversify-express-utils'

export default abstract class BaseController<T extends object = {}> extends BaseHttpController {

  protected async render(template: string, viewModel?: T, status: number = StatusCodes.OK): Promise<string> {
    return new Promise<string>((resolve, reject) =>
      this.httpContext.response
        .status(status)
        .render(template, viewModel, (err: Error, html: string) => err ? reject(err) : resolve(html))
    )
  }

}
