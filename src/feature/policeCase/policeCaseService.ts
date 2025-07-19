import * as caseModel from './policeCaseModel'
import * as response from "../../utils/response"
import Elysia from 'elysia'
import { CaseDataArray } from '../../utils/type'

export const getAllCase = async () =>{
    try{
        const result = await caseModel.getRelatedCases()
        if (result.length === 0) {
            return response.error("bad", result)
        }
        return response.success("getallcase",result)
    }
    catch (e: any) {
    console.error("SERVICE ERROR", e)
    return response.error("bad", [String(e?.message || e)])
    }
}

export const createNode = async (data:any) => {
    try {
        await caseModel.createNode(data)
        return response.success("createnode", [])
    } catch (e: any) {
    console.error("SERVICE ERROR", e)
    return response.error("bad", [String(e?.message || e)])
    }
}