import * as Joi from '@hapi/joi'

import OfficerType from 'app/models/dto/officerType.enum'
import { SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import DirectorToSign from 'app/models/session/directorToSign.model'

export default function selectSignatoriesSchema(signatories: DirectorToSign[], officerType: OfficerType): Joi.ObjectSchema {
  return Joi.object(generateSchemaForSignatories(signatories, officerType))
}

function generateSchemaForSignatories(signatories: DirectorToSign[], officerType: OfficerType): Joi.SchemaMap {
  return signatories.reduce((schema: Joi.SchemaMap, signatory: DirectorToSign) => ({
    ...schema,
    ...generateSchemaForSignatory(signatory, officerType)
  }), {})
}

function generateSchemaForSignatory(signatory: DirectorToSign, officerType: OfficerType): Joi.SchemaMap {
  const signatoryId: string = formatSignatoryId(signatory)

  const isSigningKey: string = `isSigning_${signatoryId}`

  return {
    [isSigningKey]: generateIsSigningRadioSchema(officerType),
    [`directorEmail_${signatoryId}`]: generateDirectorEmailSchema(isSigningKey, officerType),
    [`onBehalfName_${signatoryId}`]: generateOnBehalfNameSchema(isSigningKey, officerType),
    [`onBehalfEmail_${signatoryId}`]: generateOnBehalfEmailSchema(isSigningKey, officerType)
  }
}

function generateIsSigningRadioSchema(officerType: OfficerType): Joi.StringSchema {
  return Joi
    .string()
    .required()
    .valid(SignatorySigning.WILL_SIGN, SignatorySigning.ON_BEHALF)
    .messages({
      'any.only': `Select how this ${officerType} will be signing the application`,
      'any.required': `Select how this ${officerType} will be signing the application`,
      'string.empty': `Select how this ${officerType} will be signing the application`
    })
}

function generateDirectorEmailSchema(isSigningKey: string, officerType: OfficerType): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.WILL_SIGN,
      then: Joi
        .string()
        .required()
        .email()
        .messages({
          'any.required': `Enter the email address for this ${officerType}`,
          'string.empty': `Enter the email address for this ${officerType}`,
          'string.email': `Enter a valid email address for this ${officerType}`
        })
    })
}

function generateOnBehalfNameSchema(isSigningKey: string, officerType: OfficerType): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.ON_BEHALF,
      then: Joi
        .string()
        .required()
        .max(250)
        .messages({
          'any.required': `Enter the name for the person signing on behalf of this ${officerType}`,
          'string.empty': `Enter the name for the person signing on behalf of this ${officerType}`,
          'string.max': `Enter a name that is less than 250 characters for the person signing on behalf of this ${officerType}`
        })
    })
}

function generateOnBehalfEmailSchema(isSigningKey: string, officerType: OfficerType): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.ON_BEHALF,
      then: Joi
        .string()
        .required()
        .email()
        .messages({
          'any.required': `Enter the email address for the person signing on behalf of this ${officerType}`,
          'string.empty': `Enter the email address for the person signing on behalf of this ${officerType}`,
          'string.email': `Enter a valid email address for the person signing on behalf of this ${officerType}`
        })
    })
}

function formatSignatoryId(signatory: DirectorToSign): string {
  return signatory.id.toLowerCase()
}
