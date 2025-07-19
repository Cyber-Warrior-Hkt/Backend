import Elysia from "elysia"
import * as caseService from "./policeCaseService"


export const caseController = new Elysia()
.group('/api/case', (app) =>
    app
        .get("relatecase", caseService.getAllCase)
        
)