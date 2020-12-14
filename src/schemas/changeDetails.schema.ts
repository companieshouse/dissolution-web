import * as Joi from '@hapi/joi'
import { generateSchemaForSignatoryDetails } from './signatoryDetails.schema'

import OfficerType from 'app/models/dto/officerType.enum'

export default function defineSignatoryInfoSchema(officerType: OfficerType): Joi.ObjectSchema {
  return Joi.object(generateSchemaForSignatoryDetails(officerType))
}
