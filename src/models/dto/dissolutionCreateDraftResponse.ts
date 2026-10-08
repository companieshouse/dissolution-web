import DissolutionLinks from "app/models/dto/dissolutionLinks";

export default interface DissolutionCreateDraftResponse {
    dissolution_id: string;
    links: DissolutionLinks;
}
