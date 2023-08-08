export function asEmailLabel (isDirectorSigning: string): string {
    return (isDirectorSigning === "Yes" ? "Email address" : "Email address of person signing");
}
