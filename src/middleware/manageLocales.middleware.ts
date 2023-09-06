import { NextFunction, Request, RequestHandler, Response } from 'express'
import { QUERY_PAR_LANG } from 'app/constants/app.const'
import LocalesService from "app/services/locales/locales.service"

import { LanguageNames } from '@basilest-ch/ch-node-utils'

export default function ManageLocales(): RequestHandler {
      return (req: Request, res: Response, next: NextFunction) => {
         console.log("----------X2 (ManageLocales) ------------")

    let lang: string = <string>req.query[QUERY_PAR_LANG]
    console.log("=====1=====Mng Loc")
   if (! LanguageNames.isSupportedLocale (LocalesService.getInstance().localesFolder, lang)) {
         lang = "en"
    }
    req.lang = lang // add info as metadata in the request
    const [pathWithoutQuery] = req.url.split('?')
    req.url = pathWithoutQuery // remove query params from url (so previous/old controllers keep working)

    const currentUrl = `${req.protocol}://${req.get('host')}${pathWithoutQuery}`
    res.locals.currentUrl = currentUrl

    // node_modules/govuk-frontend/govuk/template.njk has (currently) the following lang vars
    res.locals.htmlLang = lang
    res.locals.pageTitleLang = lang
    res.locals.mainLang = lang

    return next()
  }
}
