import { provide } from 'inversify-binding-decorators'

@provide(CompanyNumberSanitizer)
export default class CompanyNumberSanitizer {
  private readonly COMPANY_NUMBER_SIZE: number = 8

  public sanitizeCompany(companyNumber: string): string {
    if (!companyNumber) {
      throw new Error('Company number is required')
    }

    companyNumber = companyNumber.toUpperCase()
    companyNumber = this.stripWhitespaces(companyNumber)

    return this.padNumber(companyNumber)
  }

  private stripWhitespaces(companyNumber: string): string {
    return companyNumber.replace(/\s/g, '')
  }

  private padNumber(companyNumber: string): string {
    if (/^([a-zA-Z]{2}?)/gm.test(companyNumber)) {

      const leadingChars = companyNumber.substring(0, 2)

      const trailingChars = companyNumber
        .substring(2, companyNumber.length)
        .padStart(6, '0')

      return leadingChars + trailingChars

    } else {
      return companyNumber.padStart(this.COMPANY_NUMBER_SIZE, '0')
    }
  }
}
