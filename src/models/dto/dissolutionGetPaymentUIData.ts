import PaymentItem from "./paymentItem";
import PaymentLinks from "./paymentLinks";

export default interface DissolutionGetPaymentUIData {
  ETag: string
  kind: string
  links: PaymentLinks
  company_number: string
  items: PaymentItem[]
};;;;;;;;;;;;;;;;;;;;
