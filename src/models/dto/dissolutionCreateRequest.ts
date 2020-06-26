export interface DissolutionCreateRequest {
  directors: DirectorRequest[]
}

export interface DirectorRequest {
  name: string,
  email: string,
  on_behalf_name?: string
}