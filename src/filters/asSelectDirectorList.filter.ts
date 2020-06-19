import DirectorDetails from 'app/models/directorDetails.model'

export type GovUKRadio = {
  value: string
  text: string
}

export type GovUKRadioDivider = {
  divider: string
}

export function asSelectDirectorList(directors: DirectorDetails[]): (GovUKRadio | GovUKRadioDivider)[] {
  const directorRadios: GovUKRadio[] = getDirectorRadios(directors)
  const divider: GovUKRadioDivider = { divider: 'or' }
  const notADirectorRadio: GovUKRadio = getNotADirectorRadio()

  return [...directorRadios, divider, notADirectorRadio]
}

function getDirectorRadios(directors: DirectorDetails[]): GovUKRadio[] {
  return directors.map(director => ({
    value: director.id,
    text: director.name,
  }))
}

function getNotADirectorRadio(): GovUKRadio {
  return {
    value: 'other',
    text: 'I am not a director of this company',
  }
}
