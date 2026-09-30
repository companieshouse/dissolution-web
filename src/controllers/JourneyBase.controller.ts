import BaseController from "app/controllers/base.controller";
import JourneyPathService, { JourneyPathOptions } from "app/services/session/journeyPath.service";

export default abstract class JourneyBaseController extends BaseController {
    protected constructor(protected readonly journeyPathService: JourneyPathService) {
        super();
    }

    protected journeyPath(pathTemplate: string, options?: JourneyPathOptions): string {
        return this.journeyPathService.journeyPath(this.httpContext.request, pathTemplate, options);
    }
}
