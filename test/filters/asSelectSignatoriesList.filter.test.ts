import { assert } from 'chai'
import { generateDirectorDetails } from '../fixtures/companyOfficers.fixtures'

import { asSelectSignatoriesList, GovUKCheckbox } from 'app/filters/asSelectSignatoriesList.filter'
import DirectorDetails from 'app/models/view/directorDetails.model'

describe('asSelectSignatoriesList', () => {
  const signatories: DirectorDetails[] = [
    { ...generateDirectorDetails(), id: '123', name: 'Signatory 1' },
    { ...generateDirectorDetails(), id: '456', name: 'Signatory 2' },
    { ...generateDirectorDetails(), id: '789', name: 'Signatory 3' }
  ]

  it('should create a checkbox button for each signatory', () => {
    const result: GovUKCheckbox[] = asSelectSignatoriesList(signatories)

    assert.equal(result.length, 3)
    assert.equal(result[0].text, 'Signatory 1')
    assert.equal(result[0].value, '123')
    assert.equal(result[1].text, 'Signatory 2')
    assert.equal(result[1].value, '456')
    assert.equal(result[2].text, 'Signatory 3')
    assert.equal(result[2].value, '789')
  })

  describe('checked', () => {
    it('should not preselect any checkbox if nothing is previously selected', () => {
      const result: GovUKCheckbox[] = asSelectSignatoriesList(signatories)

      assert.equal(result.length, 3)
      assert.isFalse(result[0].checked)
      assert.isFalse(result[1].checked)
      assert.isFalse(result[2].checked)
    })

    it('should preselect a checkbox if previously selected', () => {
      const result: GovUKCheckbox[] = asSelectSignatoriesList(signatories, ['123', '789'])

      assert.equal(result.length, 3)
      assert.isTrue(result[0].checked)
      assert.isFalse(result[1].checked)
      assert.isTrue(result[2].checked)
    })
  })
})
