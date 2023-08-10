import "reflect-metadata"

import { provide } from "inversify-binding-decorators"

import PresenterAuthRequest from "app/models/dto/presenterAuthRequest"
import PayByAccountDetailsFormModel from "app/models/form/payByAccountDetails.model"

@provide(PayByAccountMapper)
export default class PayByAccountMapper {

    public mapToPresenterAuthRequest (form: PayByAccountDetailsFormModel): PresenterAuthRequest {
        return {
            id: form.presenterId!,
            auth: form.presenterAuthCode!
        }
    }
}
