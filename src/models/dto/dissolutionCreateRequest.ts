export interface DissolutionCreateRequest {
  directors: DirectorRequest[]
}

export interface DirectorRequest {
  officer_id: string
  email: string
  on_behalf_name?: string
}
