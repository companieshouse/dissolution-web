import DissolutionGetResponse from "app/models/dto/dissolutionGetResponse"
import DissolutionGetDirector from "app/models/dto/dissolutionGetDirector"
import DissolutionLinks from "app/models/dto/dissolutionLinks"
import ApplicationStatus from "app/models/dto/applicationStatus.enum"
import ApplicationType from "app/models/dto/applicationType.enum"
import { DissolutionGetDirectorBuilder } from "test/fixtures/dissolutionGetDirector.builder"

export class DissolutionGetResponseBuilder {
    private _ETag: string = "ETag"
    private _kind: string = "kind"
    private _links: DissolutionLinks = {
        self: "self",
        payment: "payment"
    }
    private _application_status: ApplicationStatus = ApplicationStatus.PENDING_APPROVAL
    private _application_reference: string = "asd"
    private _application_type: ApplicationType = ApplicationType.DS01
    private _company_number: string = "12345678"
    private _company_name: string = "example name"
    private _created_at: string = "2023-01-01T00:00:00.000Z"
    private _created_by: string = "some name"
    private _directors: DissolutionGetDirector[] = []
    private _certificate_key: string = "some-key"
    private _certificate_bucket: string = "some-bucket"

    withETag(ETag: string): this {
        this._ETag = ETag
        return this
    }

    withKind(kind: string): this {
        this._kind = kind
        return this
    }

    withLinks(links: DissolutionLinks): this {
        this._links = links
        return this
    }

    withApplicationStatus(applicationStatus: ApplicationStatus): this {
        this._application_status = applicationStatus
        return this
    }

    withApplicationReference(applicationReference: string): this {
        this._application_reference = applicationReference
        return this
    }

    withApplicationType(applicationType: ApplicationType): this {
        this._application_type = applicationType
        return this
    }

    withCompanyNumber(companyNumber: string): this {
        this._company_number = companyNumber
        return this
    }

    withCompanyName(companyName: string): this {
        this._company_name = companyName
        return this
    }

    withCreatedAt(createdAt: string): this {
        this._created_at = createdAt
        return this
    }

    withCreatedBy(createdBy: string): this {
        this._created_by = createdBy
        return this
    }

    withDirectors(directors: DissolutionGetDirector[]): this {
        this._directors = directors
        return this
    }

    withDirector(directorBuilder: DissolutionGetDirectorBuilder): this {
        this._directors = [...this._directors, directorBuilder.build()]
        return this
    }

    withCertificateKey(certificateKey: string): this {
        this._certificate_key = certificateKey
        return this
    }

    withCertificateBucket(certificateBucket: string): this {
        this._certificate_bucket = certificateBucket
        return this
    }

    build(): DissolutionGetResponse {
        return {
            ETag: this._ETag,
            kind: this._kind,
            links: this._links,
            application_status: this._application_status,
            application_reference: this._application_reference,
            application_type: this._application_type,
            company_number: this._company_number,
            company_name: this._company_name,
            created_at: this._created_at,
            created_by: this._created_by,
            directors: this._directors,
            certificate_key: this._certificate_key,
            certificate_bucket: this._certificate_bucket
        }
    }
}

export function aDissolutionGetResponse(): DissolutionGetResponseBuilder {
    return new DissolutionGetResponseBuilder()
}
