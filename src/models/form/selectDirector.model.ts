export default interface SelectDirectorFormModel {
  director?: string
  _csrf?: string
  // Allow additional dynamic fields produced by the form, e.g. on-behalf-name-name_<directorId>
  [key: string]: any
}
