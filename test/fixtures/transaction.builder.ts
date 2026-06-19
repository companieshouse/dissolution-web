import { Transaction } from "@companieshouse/api-sdk-node/dist/services/transaction/types";

export class TransactionBuilder {
    private id?: string;
    private reference: string = "test-reference";
    private status?: string;
    private companyName?: string;
    private companyNumber?: string = "01777777";
    private description: string = "Some transaction description";

    public withId(id: string): this {
        this.id = id;
        return this;
    }

    public withReference(reference: string): this {
        this.reference = reference;
        return this;
    }

    public withStatus(status: string): this {
        this.status = status;
        return this;
    }

    public withCompanyName(companyName: string): this {
        this.companyName = companyName;
        return this;
    }

    public withCompanyNumber(companyNumber: string): this {
        this.companyNumber = companyNumber;
        return this;
    }

    public withDescription(description: string): this {
        this.description = description;
        return this;
    }

    public build(): Transaction {
        return {
            id: this.id,
            reference: this.reference,
            status: this.status,
            companyName: this.companyName,
            companyNumber: this.companyNumber,
            description: this.description,
        };
    }
}

export function aTransaction(): TransactionBuilder {
    return new TransactionBuilder();
}
