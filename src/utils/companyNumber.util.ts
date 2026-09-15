import { firstParam } from "app/utils/query.util";
import companyNumberSchema from "app/schemas/companyNumber.schema";

export function validateCompanyNumber(companyNumber?: string | string[]): { companyNumber?: string; error?: any } {
    const rawCompanyNumber = firstParam(companyNumber);
    const { value, error } = companyNumberSchema.validate(rawCompanyNumber);
    return { companyNumber: value, error };
}

/**
 * Captures company number from `/company/{number}` segment.
 * Excludes query strings (?), fragments (#), and matrix params (;).
 * Uses lookahead to match valid terminators.
 */
const COMPANY_NUMBER_REGEX = new RegExp(/\/company\/([^/?#;]+)(?=\/|$|[?#;])/i);

/**
 * Extracts and validates a company number from a URL path.
 * Throws if no valid company number segment is found.
 */
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
