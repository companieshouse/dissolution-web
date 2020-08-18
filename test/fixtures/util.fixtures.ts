export function generateEmail(name: string): string {
  const prefix: string[] = name.split(' ', 2)
  return `${prefix[0].toLowerCase()}${prefix[1].toLowerCase()[0]}@company.com`
}
