import { StatusCodes } from "http-status-codes";
import { inject } from "inversify";
import { controller, httpGet, httpPost, requestBody } from "inversify-express-utils";
import { RedirectResult } from "inversify-express-utils/dts/results";
import { v4 as uuidv4 } from "uuid";

import BaseController from "app/controllers/base.controller";
import { NotFoundError } from "app/errors/notFoundError.error";
import ApplicationStatus from "app/models/dto/applicationStatus.enum";
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse";
import PaymentType from "app/models/dto/paymentType.enum";
import HowDoYouWantToPayFormModel from "app/models/form/howDoYouWantToPay.model";
import Optional from "app/models/optional";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import ValidationErrors from "app/models/view/validationErrors.model";
import { HOW_DO_YOU_WANT_TO_PAY_URI, PAY_BY_ACCOUNT_URI, SEARCH_COMPANY_URI } from "app/paths";
import { howDoYouWantToPaySchema } from "app/schemas/howDoYouWantToPay.schema";
import DissolutionService from "app/services/dissolution/dissolution.service";
import PaymentService from "app/services/payment/payment.service";
import SessionService from "app/services/session/session.service";
import TYPES from "app/types";
import FormValidator from "app/utils/formValidator.util";

interface ViewModel {
  data?: Optional<HowDoYouWantToPayFormModel>
  errors?: Optional<ValidationErrors>
}

@controller(HOW_DO_YOU_WANT_TO_PAY_URI)
export class HowDoYouWantToPayController extends BaseController {

    public constructor (
    @inject(SessionService) private sessionService: SessionService,
    @inject(FormValidator) private validator: FormValidator,
    @inject(DissolutionService) private dissolutionService: DissolutionService,
    @inject(PaymentService) private paymentService: PaymentService,
    @inject(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED) private PAY_BY_ACCOUNT_FEATURE_ENABLED: number
    ) {
        super();
    }

    @httpGet('')
    public async get (): Promise<string | RedirectResult> {
        if (!this.PAY_BY_ACCOUNT_FEATURE_ENABLED) {
            return Promise.reject(new NotFoundError("Feature toggle not enabled"));
        }

        const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!;

        if (await this.isAlreadyPaid(dissolutionSession)) {
            return this.redirect(SEARCH_COMPANY_URI);
        }

        return this.renderView(dissolutionSession.howDoYouWantToPayForm);
    }

    @httpPost('')
    public async post (@requestBody() body: HowDoYouWantToPayFormModel): Promise<string | RedirectResult> {
        const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(this.httpContext.request)!;

        if (await this.isAlreadyPaid(dissolutionSession)) {
            return this.redirect(SEARCH_COMPANY_URI);
        }

        const errors: Optional<ValidationErrors> = this.validator.validate(body, howDoYouWantToPaySchema);
        if (errors) {
            return this.renderView(body, errors);
        }

        const paymentType: PaymentType = body.paymentType!;

        const redirectUrl = await this.getRedirectURI(paymentType, dissolutionSession);

        this.updateSession(dissolutionSession, paymentType, body);

        return this.redirect(redirectUrl);
    }

    private async renderView (
        data?: Optional<HowDoYouWantToPayFormModel>,
        errors?: Optional<ValidationErrors>): Promise<string> {
        const viewModel: ViewModel = {
            data,
            errors
        };

        return super.render("how-do-you-want-to-pay", viewModel, errors ? StatusCodes.BAD_REQUEST : StatusCodes.OK);
    }

    private async getRedirectURI (paymentType: PaymentType, dissolutionSession: DissolutionSession): Promise<string> {
        if (paymentType === PaymentType.ACCOUNT) {
            return PAY_BY_ACCOUNT_URI;
        }

        return await this.getCreditCardPaymentUrl(dissolutionSession);
    }

    private async getCreditCardPaymentUrl (dissolutionSession: DissolutionSession): Promise<string> {
        const token: string = this.sessionService.getAccessToken(this.httpContext.request);

        dissolutionSession.paymentStateUUID = uuidv4();

        return await this.paymentService.generatePaymentURL(token, dissolutionSession, dissolutionSession.paymentStateUUID);
    }

    private updateSession (
        dissolutionSession: DissolutionSession,
        paymentType: PaymentType,
        howDoYouWantToPayForm: HowDoYouWantToPayFormModel
    ): void {
        const updatedSession: DissolutionSession = {
            ...dissolutionSession,
            paymentType,
            howDoYouWantToPayForm
        };

        this.sessionService.setDissolutionSession(this.httpContext.request, updatedSession);
    }

    private async isAlreadyPaid (dissolutionSession: DissolutionSession): Promise<boolean> {
        const token: string = this.sessionService.getAccessToken(this.httpContext.request);

        const dissolution: Optional<DissolutionGetResponse> = await this.dissolutionService.getDissolution(token, dissolutionSession);

        return dissolution!.application_status === ApplicationStatus.PAID;
    }
}
