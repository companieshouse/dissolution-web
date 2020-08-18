import CheckYourAnswersDirector from 'app/models/view/checkYourAnswersDirector.model'

export function generateCheckYourAnswersDirector(): CheckYourAnswersDirector {
  return {
    name: 'Bob Smith',
    email: 'test@mail.com',
    isDirectorSigning: 'Yes',
  }
}
