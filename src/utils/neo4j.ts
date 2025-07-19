import neo4j from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI!
const NEO4J_USER = process.env.NEO4J_USER!
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD!
const NEO4J_DATABASE = process.env.NEO4J_DATABASE!

export const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
)

export const getSession = (mode: 'read' | 'write' = 'write') =>
  driver.session({
    defaultAccessMode:
      mode === 'read'
        ? neo4j.session.READ
        : neo4j.session.WRITE,
    database: NEO4J_DATABASE
  })

export const closeDriver = async () => {
  await driver.close()
}

export const convertNeo4jValue = (value: any): any => {
  if (neo4j.isInt(value)) return value.toNumber()
  if (Array.isArray(value)) return value.map(convertNeo4jValue)
  if (value && typeof value === 'object') {
    const result: any = {}
    for (const key in value) {
      result[key] = convertNeo4jValue(value[key])
    }
    return result
  }
  return value
}

