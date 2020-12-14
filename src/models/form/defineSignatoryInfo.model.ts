export interface DefineSignatoryInfoFormModel {
  [field: string]: string
  /*
  *  This form model represents a page whose inputs are auto-generated and cannot be modelled.
  *  There are 4 inputs per signatory:
  *
  *  isSigning_${signatoryId}?: SignatorySigning
  *  directorEmail_${signatoryId}?: string
  *  onBehalfName_${signatoryId}?: string
  *  onBehalfEmail_${signatoryId}?: string
  */
}
