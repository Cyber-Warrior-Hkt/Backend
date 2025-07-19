import { Elysia } from "elysia";
import 'dotenv/config'
import { caseController } from './feature/policeCase/policeCaseController'
// import { swagger } from "@elysiajs/swagger"


const app = new Elysia()
.use(caseController)

// .use(swagger({
//   path:"/api"
// }))
.listen(3000);

console.log(
  ` Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
