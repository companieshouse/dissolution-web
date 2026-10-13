import { Request } from "express";
import { ROUTE_PARAM_COMPANY_NUMBER, ROUTE_PARAM_TRANSACTION_ID } from "app/constants/app.const";

export const getTransactionIdFromRequestParams = (req: Request): string => req.params[ROUTE_PARAM_TRANSACTION_ID];
export const getCompanyNumberFromRequestParams = (req: Request): string => req.params[ROUTE_PARAM_COMPANY_NUMBER];

export const hasCompanyNumberAndTransactionIdInRequest = (req: Request): boolean => {
    return getTransactionIdFromRequestParams(req) !== undefined && getCompanyNumberFromRequestParams(req) !== undefined;
};

export const getCompanyNumberAndTransactionIdFromRequest = (
    req: Request
): { companyNumber: string; transactionId: string } => {
    if (!hasCompanyNumberAndTransactionIdInRequest(req)) {
        throw new Error("Company number and transaction ID are required");
    }

    return {
        companyNumber: getCompanyNumberFromRequestParams(req),
        transactionId: getTransactionIdFromRequestParams(req),
    };
};
