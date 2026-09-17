import { firstParam } from "app/utils/query.util";
import companyNumberSchema from "app/schemas/companyNumber.schema";

export function validateCompanyNumber(companyNumber?: string | string[]): { companyNumber?: string; error?: any } {
    const rawCompanyNumber = firstParam(companyNumber);
    const { value, error } = companyNumberSchema.validate(rawCompanyNumber);
    return { companyNumber: value, error };
}
