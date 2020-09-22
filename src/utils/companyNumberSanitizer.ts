import { provide } from 'inversify-binding-decorators'

@provide(CompanyNumberSanitizer)
export default class CompanyNumberSanitizer {
  private readonly COMPANY_NUMBER_SIZE: number = 8

  public sanitizeCompany(companyNumber: string): string {
    const uppercaseCompanyNumber: string = companyNumber.toUpperCase()
    const strippedCompanyNumber: string = this.stripWhitespaces(uppercaseCompanyNumber)

    return this.padNumber(strippedCompanyNumber)
  }

  private stripWhitespaces(companyNumber: string): string {
    return companyNumber.replace(/\s/g, '')
  }

  private padNumber(companyNumber: string): string {
    if (!CompanyNumberSanitizer.isAlphaPrefix(companyNumber)) {
      return companyNumber.padStart(this.COMPANY_NUMBER_SIZE, '0')
    }
    const leadingChars: string = companyNumber.substring(0, 2)
    const trailingChars: string = companyNumber
      .substring(2, companyNumber.length)
      .padStart(6, '0')

    return leadingChars + trailingChars
  }

  private static isAlphaPrefix(companyNumber: string): boolean {
    return /^([a-zA-Z]{2}?)/gm.test(companyNumber)
  }
}
