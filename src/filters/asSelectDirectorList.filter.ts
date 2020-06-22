import DirectorDetails from 'app/models/view/directorDetails.model'

export type GovUKRadio = {
  value: string
  text: string
  checked: boolean
}

export type GovUKRadioDivider = {
  divider: string
}

export function asSelectDirectorList(directors: DirectorDetails[], choice?: string): (GovUKRadio | GovUKRadioDivider)[] {
  const directorRadios: GovUKRadio[] = getDirectorRadios(directors, choice)
  const divider: GovUKRadioDivider = { divider: 'or' }
  const notADirectorRadio: GovUKRadio = getNotADirectorRadio(choice)

  return [...directorRadios, divider, notADirectorRadio]
}

function getDirectorRadios(directors: DirectorDetails[], choice?: string): GovUKRadio[] {
  return directors.map(director => asGovUKRadio(director.name, director.id, choice))
}

function getNotADirectorRadio(choice?: string): GovUKRadio {
  return asGovUKRadio('I am not a director of this company', 'other', choice)
}

function asGovUKRadio(text: string, value: string, choice?: string): GovUKRadio {
  return {
    text,
    value,
    checked: value === choice
  }
}
