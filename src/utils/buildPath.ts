type PathParams = Record<string, string | number | undefined>;

/*
 * Regex to matches a route param placeholder, e.g. ":journeyId"
 */
const PATH_PARAM_REGEX = /:(\w+)/g;

/*
 * path-to-regexp supports optional groups in string paths, this regex is used to match optional groups:
 * e.g. "(transactions/:transactionId/)?"
 */
const OPTIONAL_PATH_PARAM_REGEX = /\(([^()]*)\)\?/g;

function hasValue(params: PathParams, paramName: string): boolean {
    const value = params[paramName];
    return value !== undefined && value !== "";
}

export function buildPath(pathTemplate: string, params: PathParams): string {
    const path = pathTemplate
        .replace(OPTIONAL_PATH_PARAM_REGEX, (_, group: string) =>
            (group.match(PATH_PARAM_REGEX) ?? []).every(p => hasValue(params, p.slice(1))) ? group : ""
        )
        .replace(PATH_PARAM_REGEX, (match, name: string) =>
            hasValue(params, name) ? encodeURIComponent(String(params[name])) : match
        );

    const missingParams = path.match(PATH_PARAM_REGEX);
    if (missingParams) {
        throw new Error(`Missing route params for path "${pathTemplate}": ${missingParams.join(", ")}`);
    }
    return path;
}
