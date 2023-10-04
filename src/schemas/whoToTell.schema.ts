import * as Joi from "@hapi/joi"
import { LocalesService } from "@basilest-ch/ch-node-utils"

function formSchema (lang: string) {

    return Joi.object({
        confirmation: Joi.string()
            .required()
            .messages({
                "any.required": LocalesService.getInstance().i18nCh.resolveSingleKey("err_agree_continue", lang)
            }),
        lang: Joi.string()
    })
}

export default formSchema
