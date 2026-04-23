export function buildPath(pathTemplate: string, params: Record<string, string | number>): string {
    let path = pathTemplate

    for (const [key, value] of Object.entries(params)) {
        path = path.replace(new RegExp(`:${key}\\b`, "g"),
            encodeURIComponent(String(value)),
        )
    }

    const missingParams = path.match(/:\w+/g)
    if (missingParams) {
        throw new Error(
            `Missing route params for path "${pathTemplate}": ${missingParams.join(", ")}`,
        )
    }

    return path
}
