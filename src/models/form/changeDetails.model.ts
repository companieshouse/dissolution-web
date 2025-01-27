import SignatorySigning from "./signatorySigning.enum"

export default interface ChangeDetailsFormModel {
  isSigning?: SignatorySigning
  directorEmail?: string
  onBehalfName?: string
  onBehalfEmail?: string
  _csrf?: string
}
