import { inject } from "inversify";
import { controller, httpGet, httpPost } from "inversify-express-utils";
import { RedirectResult } from "inversify-express-utils/lib/results";
import { v4 as uuidv4 } from "uuid";

import ApplicationStatus from "app/models/dto/applicationStatus.enum";
import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse";
import PaymentSummary from "app/models/dto/paymentSummary";
import Optional from "app/models/optional";
import DissolutionSession from "app/models/session/dissolutionSession.model";
import {
    HOW_DO_YOU_WANT_TO_PAY_URI,
    PAYMENT_CALLBACK_URI,
    PAYMENT_REVIEW_URI,
    REDIRECT_GATE_URI,
    SEARCH_COMPANY_URI,
} from "app/paths";
import DissolutionService from "app/services/dissolution/dissolution.service";
import PaymentService from "app/services/payment/payment.service";
import SessionService from "app/services/session/session.service";
import TYPES from "app/types";
import JourneyBaseController from "app/controllers/JourneyBase.controller";
import JourneyPathService from "app/services/session/journeyPath.service";
import TransactionService from "app/services/transaction/transaction.service";

interface ViewModel {
    paymentSummary: PaymentSummary;
}

@controller(PAYMENT_REVIEW_URI, TYPES.JourneyIdAuthMiddleware)
export class PaymentReviewController extends JourneyBaseController {
    public constructor(
        @inject(SessionService) private sessionService: SessionService,
        @inject(DissolutionService) private dissolutionService: DissolutionService,
        @inject(PaymentService) private paymentService: PaymentService,
        @inject(TransactionService) private readonly transactionService: TransactionService,
        @inject(TYPES.PAY_BY_ACCOUNT_FEATURE_ENABLED) private readonly PAY_BY_ACCOUNT_FEATURE_ENABLED: number,
        @inject(TYPES.CHS_URL) private readonly CHS_URL: string,
        @inject(JourneyPathService) readonly journeyPathService: JourneyPathService
    ) {
        super(journeyPathService);
    }

    @httpGet("")
    public async get(): Promise<RedirectResult | string> {
        const token: string = this.sessionService.getAccessToken(this.httpContext.request);
        const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(
            this.httpContext.request
        )!;

        const dissolution: Optional<DissolutionGetResponse> = await this.getDissolution(dissolutionSession, token);

        if (!dissolution) {
            throw new Error("Unable to retrieve the dissolution before proceeding to payment");
        }

        if (await this.isAlreadyPaid(dissolution, token)) {
            return this.redirect(SEARCH_COMPANY_URI);
        }

        const { transaction_id, company_number, company_name } = dissolution;
        const paymentSummary: PaymentSummary = transaction_id
            ? this.dissolutionService.getTransactionDissolutionPaymentSummary(company_number, company_name)
            : await this.dissolutionService.getDissolutionPaymentSummary(dissolutionSession);

        return this.renderView(paymentSummary);
    }

    @httpPost("")
    public async post(): Promise<RedirectResult> {
        const token: string = this.sessionService.getAccessToken(this.httpContext.request);
        const dissolutionSession: DissolutionSession = this.sessionService.getDissolutionSession(
            this.httpContext.request
        )!;

        const dissolution: Optional<DissolutionGetResponse> = await this.getDissolution(dissolutionSession, token);

        if (!dissolution) {
            throw new Error("Unable to retrieve the dissolution before proceeding to payment");
        }

        if (dissolution.transaction_id) {
            return this.startTransactionPayment(token, dissolutionSession, dissolution.transaction_id);
        }

        if (this.PAY_BY_ACCOUNT_FEATURE_ENABLED) {
            return this.redirect(this.journeyPath(HOW_DO_YOU_WANT_TO_PAY_URI));
        }

        const paymentStateUUID: string = uuidv4();

        const paymentRedirectURI = `${this.CHS_URL}${this.journeyPath(PAYMENT_CALLBACK_URI)}`;

        const paymentURL: string = await this.paymentService.generatePaymentURL(
            token,
            dissolutionSession,
            paymentStateUUID,
            paymentRedirectURI
        );

        this.updateSession(dissolutionSession, paymentStateUUID);

        return this.redirect(paymentURL);
    }

    private async startTransactionPayment(
        token: string,
        dissolutionSession: DissolutionSession,
        transactionId: string
    ): Promise<RedirectResult> {
        const paymentSessionUrl: string | undefined = await this.transactionService.closeTransaction(
            token,
            transactionId
        );

        if (!paymentSessionUrl) {
            return this.redirect(this.journeyPath(REDIRECT_GATE_URI));
        }

        const paymentStateUUID: string = uuidv4();
        const paymentRedirectURI = `${this.CHS_URL}${this.journeyPath(PAYMENT_CALLBACK_URI)}`;

        const paymentURL: string = await this.paymentService.generateTransactionPaymentURL(
            token,
            paymentSessionUrl,
            transactionId,
            paymentStateUUID,
            paymentRedirectURI
        );

        this.updateSession(dissolutionSession, paymentStateUUID);

        return this.redirect(paymentURL);
    }

    private async isAlreadyPaid(dissolution: DissolutionGetResponse, token: string): Promise<boolean> {
        if (dissolution.transaction_id) {
            return this.transactionService.isTransactionClosed(token, dissolution.transaction_id);
        }

        return dissolution.application_status === ApplicationStatus.PAID;
    }

    private async renderView(paymentSummary: PaymentSummary): Promise<string> {
        const viewModel: ViewModel = {
            paymentSummary,
        };

        return super.render("payment-review", viewModel);
    }

    private updateSession(dissolutionSession: DissolutionSession, paymentStateUUID: string): void {
        const updatedSession: DissolutionSession = {
            ...dissolutionSession,
            paymentStateUUID,
        };

        this.sessionService.setDissolutionSession(this.httpContext.request, updatedSession);
    }

    private async getDissolution(
        session: DissolutionSession,
        token: string
    ): Promise<Optional<DissolutionGetResponse>> {
        return this.dissolutionService.getDissolution(token, session);
    }
}
