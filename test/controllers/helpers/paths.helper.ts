import { buildPath } from "app/utils/buildPath";

export const TEST_JOURNEY_ID = "e1101f0a-5121-4429-acee-a817c5cAAAAA";
export const TEST_COMPANY_NUMBER = "01777777";

export const DEFAULT_URL_PARAMS = { journeyId: TEST_JOURNEY_ID, companyNumber: TEST_COMPANY_NUMBER };

export const buildTestUrl = (pathTemplate: string, paramOverrides: Record<string, string | number> = {}) =>
    buildPath(pathTemplate, { ...DEFAULT_URL_PARAMS, ...paramOverrides });
