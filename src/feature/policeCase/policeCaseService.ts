import * as caseModel from './policeCaseModel'
import * as response from "../../utils/response"

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