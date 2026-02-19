export interface DefineSignatoryInfoFormModel {
  [field: string]: string
  /*
  *  This form model represents a page whose inputs are auto-generated and cannot be modelled.
  *  There are 3 inputs per signatory:
  *
  *  directorEmail_${signatoryId}?: string
  *  onBehalfName_${signatoryId}?: string
  *  onBehalfEmail_${signatoryId}?: string
  */
}
