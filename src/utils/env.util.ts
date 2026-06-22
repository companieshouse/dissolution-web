import Optional from "app/models/optional";

export function getEnv(name: string): Optional<string> {
    return process.env[name];
}

export function getEnvOr(name: string, fallbackSupplier: () => string): string {
    const value = getEnv(name);

    if (value) {
        return value;
    }

    return fallbackSupplier();
}

export function getEnvOrDefault(name: string, defaultValue: string): string {
    return getEnvOr(name, () => defaultValue);
}

export function getEnvOrThrow(name: string): string {
    return getEnvOr(name, () => {
        throw new Error(`Variable ${name} was not found`);
    });
}

export const parseFeatureFlag = (flag: string | undefined): boolean => {
    if (flag === undefined) {
        return false;
    }
    const featureFlag = flag.toLowerCase();
    return featureFlag === "true" || featureFlag === "1" || featureFlag === "on" || featureFlag === "yes";
};
