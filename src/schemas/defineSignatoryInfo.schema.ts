import * as Joi from '@hapi/joi'

import { SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import DirectorToSign from 'app/models/session/directorToSign.model'

export default function selectSignatoriesSchema(signatories: DirectorToSign[]): Joi.ObjectSchema {
  return Joi.object(generateSchemaForSignatories(signatories))
}

function generateSchemaForSignatories(signatories: DirectorToSign[]): Joi.SchemaMap {
  return signatories.reduce((schema: Joi.SchemaMap, signatory: DirectorToSign) => ({
    ...schema,
    ...generateSchemaForSignatory(signatory)
  }), {})
}

function generateSchemaForSignatory(signatory: DirectorToSign): Joi.SchemaMap {
  const signatoryId: string = formatSignatoryId(signatory)
  const signatoryName: string = signatory.name

  const isSigningKey: string = `isSigning_${signatoryId}`

  return {
    [isSigningKey]: generateIsSigningRadioSchema(signatoryName),
    [`directorEmail_${signatoryId}`]: generateDirectorEmailSchema(isSigningKey, signatoryName),
    [`onBehalfName_${signatoryId}`]: generateOnBehalfNameSchema(isSigningKey, signatoryName),
    [`onBehalfEmail_${signatoryId}`]: generateOnBehalfEmailSchema(isSigningKey, signatoryName)
  }
}

function generateIsSigningRadioSchema(signatoryName: string): Joi.StringSchema {
  return Joi
    .string()
    .required()
    .valid(SignatorySigning.WILL_SIGN, SignatorySigning.ON_BEHALF)
    .messages({
      'any.only': `Select how  will be signing the application`,
      'any.required': `Select how ${signatoryName} will be signing the application`,
      'string.empty': `Select how ${signatoryName} will be signing the application`
    })
}

function generateDirectorEmailSchema(isSigningKey: string, signatoryName: string): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.WILL_SIGN,
      then: Joi
        .string()
        .required()
        .email()
        .messages({
          'any.required': `Enter the email address for ${signatoryName}`,
          'string.empty': `Enter the email address for ${signatoryName}`,
          'string.email': `Enter a valid email address for ${signatoryName}`
        })
    })
}

function generateOnBehalfNameSchema(isSigningKey: string, signatoryName: string): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.ON_BEHALF,
      then: Joi
        .string()
        .required()
        .max(250)
        .messages({
          'any.required': `Enter the name for the person signing on behalf of ${signatoryName}`,
          'string.empty': `Enter the name for the person signing on behalf of ${signatoryName}`,
          'string.max': `Enter a name that is less than 250 characters for the person signing on behalf of ${signatoryName}`
        })
    })
}

function generateOnBehalfEmailSchema(isSigningKey: string, signatoryName: string): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.ON_BEHALF,
      then: Joi
        .string()
        .required()
        .email()
        .messages({
          'any.required': `Enter the email address for the person signing on behalf of ${signatoryName}`,
          'string.empty': `Enter the email address for the person signing on behalf of ${signatoryName}`,
          'string.email': `Enter a valid email address for the person signing on behalf of ${signatoryName}`
        })
    })
}

function formatSignatoryId(signatory: DirectorToSign): string {
  return signatory.id.toLowerCase()
}
