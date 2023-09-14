import * as Joi from "@hapi/joi"
import { LocalesService } from "@basilest-ch/ch-node-utils"

function formSchema(lang: string)  {
   const t = LocalesService.getInstance().i18nCh.resolveSingleKey
   const emptyCompanyNumberError = t("err_company_num", lang)
   const companyIncorrect = t("err_company_incorrect", lang)

   return  Joi.object({
      companyNumber: Joi.string()
         .required()
         .max(8)
         .messages({
               "string.empty": emptyCompanyNumberError,
               "string.max": companyIncorrect,
               "any.required": emptyCompanyNumberError
         })
   })
}

export default formSchema
