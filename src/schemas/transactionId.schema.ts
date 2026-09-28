import * as Joi from "joi";

/*
 * Regex pattern derived by autoGenerateId method in the transactions-api.
 * https://github.com/companieshouse/transactions.api.ch.gov.uk/blob/03fe603c3fa3cb2e7d6aec0b591fef286934f971/src/main/java/uk/gov/companieshouse/api/transactions/controller/PublicTransactionController.java#L759
 */
const TRANSACTION_ID_REGEX = /^\d{6}-\d{6}-\d{6}$/;

const transactionIdSchema = Joi.string().trim().pattern(TRANSACTION_ID_REGEX).required();

export default transactionIdSchema;
