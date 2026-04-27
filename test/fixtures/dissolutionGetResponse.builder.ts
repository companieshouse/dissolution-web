import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import ApplicationStatus from "app/models/dto/applicationStatus.enum"
import ApplicationType from "app/models/dto/applicationType.enum"
import DissolutionLinks from "app/models/dto/dissolutionLinks"
import { aDissolutionGetDirector } from "./dissolutionGetDirector.builder"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"

export class DissolutionGetResponseBuilder {
    private ETag: string = "ETag"
    private kind: string = "kind"
    private links: DissolutionLinks = { self: "self", payment: "payment" }
    private application_status: ApplicationStatus = ApplicationStatus.PENDING_APPROVAL
    private application_reference: string = "asd"
    private application_type: ApplicationType = ApplicationType.DS01
    private company_number: string = "12345678"
    private company_name: string = "example name"
    private created_at: string = new Date().toDateString()
    private created_by: string = "some name"
    private directors: DissolutionGetDirector[] = [aDissolutionGetDirector().withOfficerId("abc123").build(), aDissolutionGetDirector().withOfficerId("abc124").build()]
    private certificate_bucket: string = "some-bucket"
    private certificate_key: string = "some-key"

    withETag (eTag: string): this { this.ETag = eTag; return this }
    withKind (kind: string): this { this.kind = kind; return this }
    withLinks (links: DissolutionLinks): this { this.links = links; return this }
    withApplicationStatus (status: ApplicationStatus): this { this.application_status = status; return this }
    withApplicationReference (ref: string): this { this.application_reference = ref; return this }
    withApplicationType (type: ApplicationType): this { this.application_type = type; return this }
    withCompanyNumber (num: string): this { this.company_number = num; return this }
    withCompanyName (name: string): this { this.company_name = name; return this }
    withCreatedAt (date: string): this { this.created_at = date; return this }
    withCreatedBy (by: string): this { this.created_by = by; return this }
    withDirectors (directors: DissolutionGetDirector[]): this { this.directors = directors; return this }
    withCertificateBucket (bucket: string): this { this.certificate_bucket = bucket; return this }
    withCertificateKey (key: string): this { this.certificate_key = key; return this }

    build (): DissolutionGetResponse {
        return {
            ETag: this.ETag,
            kind: this.kind,
            links: this.links,
            application_status: this.application_status,
            application_reference: this.application_reference,
            application_type: this.application_type,
            company_name: this.company_name,
            company_number: this.company_number,
            created_at: this.created_at,
            created_by: this.created_by,
            directors: this.directors,
            certificate_bucket: this.certificate_bucket,
            certificate_key: this.certificate_key
        } as DissolutionGetResponse
    }
}

export function aDissolutionGetResponse (): DissolutionGetResponseBuilder {
    return new DissolutionGetResponseBuilder()
}

