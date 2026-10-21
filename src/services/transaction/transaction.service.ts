import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";
import { provide } from "inversify-binding-decorators";
import { inject } from "inversify";
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";
import TransactionApiClient from "app/services/clients/transactionApi.client";

@provide(TransactionService)
export default class TransactionService {
    public constructor(
        @inject(TransactionApiClient) private readonly client: TransactionApiClient,
        @inject(ApplicationLogger) private readonly logger: ApplicationLogger
    ) {}

    public async createTransaction(
        token: string,
        companyNumber: string,
        description: string,
        reference: string
    ): Promise<Transaction> {
        const transaction: Transaction = {
            companyNumber,
            reference,
            description,
        };

        try {
            const response: Transaction = await this.client.postTransaction(token, transaction);
            this.logger.debug(`Received transaction ${JSON.stringify(response)}`);
            return response;
        } catch (err: unknown) {
            this.logger.error(
                `Failed to create transaction for company number ${companyNumber}: ${err instanceof Error ? err.message : JSON.stringify(err)}`
            );
            throw new Error(`Failed to create transaction for company number ${companyNumber}`);
        }
    }

    public async closeTransaction(token: string, transactionId: string): Promise<void> {
        try {
            await this.client.closeTransaction(token, transactionId);
        } catch (err: unknown) {
            this.logger.error(
                `Failed to close transaction ${transactionId}: ${err instanceof Error ? err.message : JSON.stringify(err)}`
            );
            throw new Error(`Failed to close transaction ${transactionId}`);
        }
    }
}
