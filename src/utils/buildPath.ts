export function buildPath(pathTemplate: string, params: Record<string, string | number>): string {
    let path = pathTemplate;

    // Remove optional segments if their params are missing
    path = path.replace(/\{([^}]+)\}/g, (match, content) => {
        const paramMatch = content.match(/:\w+/g);
        if (
            paramMatch?.some((param: string) => {
                const paramName = param.substring(1);
                return !(paramName in params);
            })
        ) {
            return "";
        }
        return content;
    });

    // Replace params
    for (const [key, value] of Object.entries(params)) {
        path = path.replace(new RegExp(`:${key}\\b`, "g"), encodeURIComponent(String(value)));
    }

    // Check for any remaining unreplaced params
    const missingParams = path.match(/:\w+/g);
    if (missingParams) {
        throw new Error(`Missing route params for path "${pathTemplate}": ${missingParams.join(", ")}`);
    }

    return path;
}
