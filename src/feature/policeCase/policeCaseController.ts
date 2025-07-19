import Elysia from "elysia"
import {t} from "elysia"
import * as caseService from "./policeCaseService"


export const caseController = new Elysia()
.group('/api/case', (app) =>
    app
        .get("relatecase", caseService.getAllCase)
        .post("createNode",({body}) => {
            return caseService.createNode(body.data)
        },{
            body: t.Object({
                data: t.Array(t.Record(t.String(), t.Any()))
            })
        })
        
)