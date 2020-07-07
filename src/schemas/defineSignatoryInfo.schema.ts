import * as Joi from '@hapi/joi'

import { SignatorySigning } from 'app/models/form/defineSignatoryInfo.model'
import DirectorToSign from 'app/models/session/directorToSign.model'

const SIGNING_ERROR: string = 'Select how the director will be signing the application'
const CONTACT_DETAILS_ERROR: string = 'Enter contact details for the directors'

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
  const isSigningKey: string = `isSigning_${signatory.id}`

  return {
    [isSigningKey]: generateIsSigningRadioSchema(),
    [`directorEmail_${signatory.id}`]: generateDirectorEmailSchema(isSigningKey),
    [`onBehalfName_${signatory.id}`]: generateOnBehalfNameSchema(isSigningKey),
    [`onBehalfEmail_${signatory.id}`]: generateOnBehalfEmailSchema(isSigningKey)
  }
}

function generateIsSigningRadioSchema(): Joi.StringSchema {
  return Joi
    .string()
    .required()
    .valid(SignatorySigning.WILL_SIGN, SignatorySigning.ON_BEHALF)
    .messages({
      'any.only': SIGNING_ERROR,
      'any.required': SIGNING_ERROR,
      'string.empty': SIGNING_ERROR
    })
}

function generateDirectorEmailSchema(isSigningKey: string): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.WILL_SIGN,
      then: Joi
        .string()
        .required()
        .email()
        .messages({
          'any.required': CONTACT_DETAILS_ERROR,
          'string.empty': CONTACT_DETAILS_ERROR,
          'string.email': CONTACT_DETAILS_ERROR
        })
    })
}

function generateOnBehalfNameSchema(isSigningKey: string): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.ON_BEHALF,
      then: Joi
        .string()
        .required()
        .max(250)
        .messages({
          'any.required': CONTACT_DETAILS_ERROR,
          'string.empty': CONTACT_DETAILS_ERROR,
          'string.max': CONTACT_DETAILS_ERROR
        })
    })
}

function generateOnBehalfEmailSchema(isSigningKey: string): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.ON_BEHALF,
      then: Joi
        .string()
        .required()
        .email()
        .messages({
          'any.required': CONTACT_DETAILS_ERROR,
          'string.empty': CONTACT_DETAILS_ERROR,
          'string.email': CONTACT_DETAILS_ERROR
        })
    })
}
