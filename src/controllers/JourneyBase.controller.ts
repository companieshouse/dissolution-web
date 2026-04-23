import BaseController from "app/controllers/base.controller"
import JourneyPathService from "app/services/session/journeyPath.service";


export default abstract class JourneyBaseController extends BaseController {

    protected constructor(protected readonly journeyPathService: JourneyPathService) {
        super()
    }

    protected journeyPath(
        pathTemplate: string,
        options?: {
            journeyId?: string,
            params?: Record<string, string | number>
        }): string {

        return this.journeyPathService.journeyPath(this.httpContext.request, pathTemplate, options)
    }
}
