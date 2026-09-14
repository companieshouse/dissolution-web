import { firstParam } from "app/utils/query.util";
import companyNumberSchema from "app/schemas/companyNumber.schema";

export function validateCompanyNumber(companyNumber?: string | string[]): { companyNumber?: string; error?: any } {
    const rawCompanyNumber = firstParam(companyNumber);
    const { value, error } = companyNumberSchema.validate(rawCompanyNumber);
    return { companyNumber: value, error };
}

/**
 * This regex will capture a company number, that is an alphanumeric string which is 8 characters long
 */
const COMPANY_NUMBER_REGEX = new RegExp(/\/company\/([A-Za-z0-9]{1,8})/);

export function extractCompanyNumberFromPath(path: string): string {
    const match = COMPANY_NUMBER_REGEX.exec(path);

    if (!match) {
        throw new Error("No company number found in path");
    }

    const { value, error } = companyNumberSchema.validate(match[1]);
    if (error || !value) {
        throw new Error("Invalid company number");
    }
    return value;
}
