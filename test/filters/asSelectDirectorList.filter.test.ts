import { assert } from "chai";
import { generateDirectorDetails } from "../fixtures/companyOfficers.fixtures";

import { asSelectDirectorList, GovUKRadio, GovUKRadioDivider } from "app/filters/asSelectDirectorList.filter";
import OfficerType from "app/models/dto/officerType.enum";
import DirectorDetails from "app/models/view/directorDetails.model";

describe("asSelectDirectorList", () => {
    it("should create a radio button for each director, then a divider, then a default", () => {
        const directors: DirectorDetails[] = [
            { ...generateDirectorDetails(), id: "123" },
            { ...generateDirectorDetails(), id: "456" }
        ];

        const result: (GovUKRadio | GovUKRadioDivider)[] = asSelectDirectorList(directors, OfficerType.DIRECTOR);

        assert.equal(result.length, 4);
    });

    it("should create each director radio using the director name and ID", () => {
        const directors: DirectorDetails[] = [
            { ...generateDirectorDetails(), id: "123", name: "Director One" },
            { ...generateDirectorDetails(), id: "456", name: "Director Two" }
        ];

        const result: (GovUKRadio | GovUKRadioDivider)[] = asSelectDirectorList(directors, OfficerType.DIRECTOR);

        const director1Radio: GovUKRadio = result[0] as GovUKRadio;
        assert.equal(director1Radio.text, "Director One");
        assert.equal(director1Radio.value, "123");

        const director2Radio: GovUKRadio = result[1] as GovUKRadio;
        assert.equal(director2Radio.text, "Director Two");
        assert.equal(director2Radio.value, "456");
    });

    it("should create the divider radio correctly", () => {
        const directors: DirectorDetails[] = [
            generateDirectorDetails(),
            generateDirectorDetails()
        ];

        const result: (GovUKRadio | GovUKRadioDivider)[] = asSelectDirectorList(directors, OfficerType.DIRECTOR);

        const dividerRadio: GovUKRadioDivider = result[2] as GovUKRadioDivider;
        assert.equal(dividerRadio.divider, "or");
    });

    it("should create the default radio correctly", () => {
        const directors: DirectorDetails[] = [
            generateDirectorDetails(),
            generateDirectorDetails()
        ];

        const result: (GovUKRadio | GovUKRadioDivider)[] = asSelectDirectorList(directors, OfficerType.DIRECTOR);

        const defaultRadio: GovUKRadio = result[3] as GovUKRadio;
        assert.equal(defaultRadio.text, "I am not a director of this company");
        assert.equal(defaultRadio.value, "other");
    });

    it("should display OfficerType Member on radio button where user selects they are not a member", () => {
        const directors: DirectorDetails[] = [
            generateDirectorDetails(),
            generateDirectorDetails()
        ];
        const result: (GovUKRadio | GovUKRadioDivider)[] = asSelectDirectorList(directors, OfficerType.MEMBER, "other");

        const defaultRadio: GovUKRadio = result[3] as GovUKRadio;
        assert.equal(defaultRadio.text, "I am not a member of this company");
    });

    describe("checked", () => {
        it("should not select any radio if nothing is previously selected", () => {
            const directors: DirectorDetails[] = [
                { ...generateDirectorDetails(), id: "123", name: "Director One" },
                { ...generateDirectorDetails(), id: "456", name: "Director Two" }
            ];

            const result: (GovUKRadio | GovUKRadioDivider)[] = asSelectDirectorList(directors, OfficerType.DIRECTOR);

            const director1Radio: GovUKRadio = result[0] as GovUKRadio;
            assert.isFalse(director1Radio.checked);

            const director2Radio: GovUKRadio = result[1] as GovUKRadio;
            assert.isFalse(director2Radio.checked);

            const defaultRadio: GovUKRadio = result[3] as GovUKRadio;
            assert.isFalse(defaultRadio.checked);
        });

        it("should select a director radio if previously selected", () => {
            const directors: DirectorDetails[] = [
                { ...generateDirectorDetails(), id: "123", name: "Director One" },
                { ...generateDirectorDetails(), id: "456", name: "Director Two" }
            ];

            const result: (GovUKRadio | GovUKRadioDivider)[] = asSelectDirectorList(directors, OfficerType.DIRECTOR, "456");

            const director1Radio: GovUKRadio = result[0] as GovUKRadio;
            assert.isFalse(director1Radio.checked);

            const director2Radio: GovUKRadio = result[1] as GovUKRadio;
            assert.isTrue(director2Radio.checked);

            const defaultRadio: GovUKRadio = result[3] as GovUKRadio;
            assert.isFalse(defaultRadio.checked);
        });

        it("should select the default radio if previously selected", () => {
            const directors: DirectorDetails[] = [
                { ...generateDirectorDetails(), id: "123", name: "Director One" },
                { ...generateDirectorDetails(), id: "456", name: "Director Two" }
            ];

            const result: (GovUKRadio | GovUKRadioDivider)[] = asSelectDirectorList(directors, OfficerType.DIRECTOR, "other");

            const director1Radio: GovUKRadio = result[0] as GovUKRadio;
            assert.isFalse(director1Radio.checked);

            const director2Radio: GovUKRadio = result[1] as GovUKRadio;
            assert.isFalse(director2Radio.checked);

            const defaultRadio: GovUKRadio = result[3] as GovUKRadio;
            assert.isTrue(defaultRadio.checked);
        });
    });
});
