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
  const isSigningKey: string = `isSigning_${signatory.id}`

  return {
    [isSigningKey]: generateIsSigningRadioSchema(signatory),
    [`directorEmail_${signatory.id}`]: generateDirectorEmailSchema(isSigningKey, signatory),
    [`onBehalfName_${signatory.id}`]: generateOnBehalfNameSchema(isSigningKey, signatory),
    [`onBehalfEmail_${signatory.id}`]: generateOnBehalfEmailSchema(isSigningKey, signatory)
  }
}

function generateIsSigningRadioSchema(signatory: DirectorToSign): Joi.StringSchema {
  return Joi
    .string()
    .required()
    .valid(SignatorySigning.WILL_SIGN, SignatorySigning.ON_BEHALF)
    .messages({
      'any.only': `Select how ${signatory.name} will be signing the application`,
      'any.required': `Select how ${signatory.name} will be signing the application`,
      'string.empty': `Select how ${signatory.name} will be signing the application`
    })
}

function generateDirectorEmailSchema(isSigningKey: string, signatory: DirectorToSign): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.WILL_SIGN,
      then: Joi
        .string()
        .required()
        .email()
        .messages({
          'any.required': `Enter the email address for ${signatory.name}`,
          'string.empty': `Enter the email address for ${signatory.name}`,
          'string.email': `Enter a valid email address for ${signatory.name}`
        })
    })
}

function generateOnBehalfNameSchema(isSigningKey: string, signatory: DirectorToSign): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.ON_BEHALF,
      then: Joi
        .string()
        .required()
        .max(250)
        .messages({
          'any.required': `Enter the name for the person signing on behalf of ${signatory.name}`,
          'string.empty': `Enter the name for the person signing on behalf of ${signatory.name}`,
          'string.max': `Enter a name that is less than 250 characters for the person signing on behalf of ${signatory.name}`
        })
    })
}

function generateOnBehalfEmailSchema(isSigningKey: string, signatory: DirectorToSign): Joi.AlternativesSchema {
  return Joi
    .when(isSigningKey, {
      is: SignatorySigning.ON_BEHALF,
      then: Joi
        .string()
        .required()
        .email()
        .messages({
          'any.required': `Enter the email address for the person signing on behalf of ${signatory.name}`,
          'string.empty': `Enter the email address for the person signing on behalf of ${signatory.name}`,
          'string.email': `Enter a valid email address for the person signing on behalf of ${signatory.name}`
        })
    })
}
