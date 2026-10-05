import DissolutionSession from "app/models/session/dissolutionSession.model";
import { capture } from "ts-mockito";
import SessionService from "app/services/session/session.service";
import { Request } from "express";

export const getSavedSession = (session: SessionService): DissolutionSession =>
    capture<Request, DissolutionSession>(session.setDissolutionSession).last()[1];
