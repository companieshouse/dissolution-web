export interface DissolutionCreateRequest {
  directors: DirectorRequest[]
}

export interface DirectorRequest {
  name: string,
  email: string,
  onBehalfName?: string
}