export default function convertToCurrency (value: number): string {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value)
}
