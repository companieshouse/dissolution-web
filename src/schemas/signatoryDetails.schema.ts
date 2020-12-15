import * as Joi from '@hapi/joi'

import OfficerType from 'app/models/dto/officerType.enum'
import SignatorySigning from 'app/models/form/signatorySigning.enum'

export function generateSchemaForSignatoryDetails(officerType: OfficerType, formSuffix: string = ''): Joi.SchemaMap {
  const isSigningKey: string = `isSigning${formSuffix}`

  return {
    [isSigningKey]: generateIsSigningRadioSchema(officerType),
    [`directorEmail${formSuffix}`]: generateDirectorEmailSchema(isSigningKey, officerType),
    [`onBehalfName${formSuffix}`]: generateOnBehalfNameSchema(isSigningKey, officerType),
    [`onBehalfEmail${formSuffix}`]: generateOnBehalfEmailSchema(isSigningKey, officerType)
  }
}

function generateIsSigningRadioSchema(officerType: OfficerType): Joi.StringSchema {
  return Joi
    .string()
    .required()
    .valid(SignatorySigning.WILL_SIGN, SignatorySigning.ON_BEHALF)
    .messages({
      'any.only': `Select how the ${officerType} will be signing the application`,
      'any.required': `Select how the ${officerType} will be signing the application`,
      'string.empty': `Select how the ${officerType} will be signing the application`
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
          'any.required': `Enter the email address for the ${officerType}`,
          'string.empty': `Enter the email address for the ${officerType}`,
          'string.email': `Enter a valid email address for the ${officerType}`
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
          'any.required': `Enter the name for the person signing on behalf of the ${officerType}`,
          'string.empty': `Enter the name for the person signing on behalf of the ${officerType}`,
          'string.max': `Enter a name that is less than 250 characters for the person signing on behalf of the ${officerType}`
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
          'any.required': `Enter the email address for the person signing on behalf of the ${officerType}`,
          'string.empty': `Enter the email address for the person signing on behalf of the ${officerType}`,
          'string.email': `Enter a valid email address for the person signing on behalf of the ${officerType}`
        })
    })
}
