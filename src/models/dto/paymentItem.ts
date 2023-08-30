import ApplicationType from "./applicationType.enum"

export default interface PaymentItem {
  description: string
  description_identifier: string
  description_values: {}
  product_type: ApplicationType
  amount: string
  available_payment_methods: string[]
  class_of_payment: string[]
  kind: string
  resource_kind: string
}
