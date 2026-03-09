import { assert } from "chai"

import { asGovUKErrorList, GovUKError } from "app/filters/asGovUKErrorList.filter"
import ValidationErrors from "app/models/view/validationErrors.model"

describe("asGovUKErrorListFilter", () => {
    it("should transform validationErrors object to a list of GovUKErrors", () => {
        const validationErrors: ValidationErrors = {
            someTextField: "You must enter at least 3 characters",
            someEmailField: "You must enter a valid email address",
            someOtherTextField: {
                message: "You must enter a valid value",
                alt_message: "invalid-text"
            }
        }

        const govUKErrorList: GovUKError[] =
      [
          {
              href: "#some-text-field",
              text: "You must enter at least 3 characters"
          },
          {
              href: "#some-email-field",
              text: "You must enter a valid email address"
          },
          {
              href: "#some-other-text-field",
              text: "You must enter a valid value",
              attributes: {
                  "data-alt-text": "invalid-text"
              }
          },

      ]

        assert.deepEqual(asGovUKErrorList(validationErrors), govUKErrorList)
    })

    it("should throw TypeError if null or undefined are passed as an argument", () => {
        assert.throw(() => {
            asGovUKErrorList(null as any)
        }, TypeError, "Cannot convert undefined or null to object")

        assert.throw(() => {
            asGovUKErrorList(undefined as any)
        }, TypeError, "Cannot convert undefined or null to object")
    })

    it("should return empty array if empty object is passed as an argument", () => {
        assert.deepEqual(asGovUKErrorList({}), [])
    })

    it("should omit attributes when alt_message is not present", () => {
        const validationErrors: ValidationErrors = {
            someTextField: {
                message: "You must enter a value"
            }
        }

        const govUKErrorList: GovUKError[] = [
            {
                href: "#some-text-field",
                text: "You must enter a value"
            }
        ]

        assert.deepEqual(asGovUKErrorList(validationErrors), govUKErrorList)
    })

    it("should return empty string if value is not a string and has no message property", () => {
        // @ts-expect-error purposely passing an invalid object
        assert.equal(asGovUKErrorList({ badField: { notMessage: "oops" } })[0].text, "")
        // @ts-expect-error purposely passing null
        assert.equal(asGovUKErrorList({ badField: null })[0].text, "")
        // @ts-expect-error purposely passing undefined
        assert.equal(asGovUKErrorList({ badField: undefined })[0].text, "")
    })

})
