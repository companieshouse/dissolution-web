export default interface SelectDirectorFormModel {
  director?: string
  _csrf?: string
  // Allow additional dynamic fields produced by the form, e.g. onBehalfName_<directorId>
  [key: string]: string | undefined
}
