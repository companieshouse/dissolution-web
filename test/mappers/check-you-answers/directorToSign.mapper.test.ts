import { assert } from "chai";
import { generateDirectorDetails } from "../../fixtures/companyOfficers.fixtures";

import DirectorToSignMapper from "app/mappers/check-your-answers/directorToSign.mapper";
import { DirectorToSign } from "app/models/session/directorToSign.model";
import DirectorDetails from "app/models/view/directorDetails.model";

describe("DirectorToSignMapper", () => {

    const mapper: DirectorToSignMapper = new DirectorToSignMapper();

    const ID = "123";
    const NAME = "Geoff Smith";
    const EMAIL = "test@mail.com";

    describe("mapAsApplicant", () => {
        it("should map id and name", () => {
            const director: DirectorDetails = generateDirectorDetails();
            director.id = ID;
            director.name = NAME;

            const result: DirectorToSign = mapper.mapAsApplicant(director, EMAIL);

            assert.equal(result.id, ID);
            assert.equal(result.name, NAME);
        });

        it("should map the provided email", () => {
            const director: DirectorDetails = generateDirectorDetails();

            const result: DirectorToSign = mapper.mapAsApplicant(director, EMAIL);

            assert.equal(result.email, EMAIL);
        });

        it("should mark the director as the applicant", () => {
            const director: DirectorDetails = generateDirectorDetails();

            const result: DirectorToSign = mapper.mapAsApplicant(director, EMAIL);

            assert.isTrue(result.isApplicant);
        });
    });

    describe("mapAsSignatory", () => {
        it("should map id and name", () => {
            const director: DirectorDetails = generateDirectorDetails();
            director.id = ID;
            director.name = NAME;

            const result: DirectorToSign = mapper.mapAsSignatory(director);

            assert.equal(result.id, ID);
            assert.equal(result.name, NAME);
        });

        it("should not mark the director as the applicant", () => {
            const director: DirectorDetails = generateDirectorDetails();

            const result: DirectorToSign = mapper.mapAsSignatory(director);

            assert.isFalse(result.isApplicant);
        });
    });
});
