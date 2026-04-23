export function firstParam (value?: string | string[] | null): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    return Array.isArray(value) ? value[0] : value
}

