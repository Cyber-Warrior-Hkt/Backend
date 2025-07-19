import neo4j from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI!
const NEO4J_USER = process.env.NEO4J_USER!
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD!

export const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
)

export const getSession = (mode: 'read' | 'write' = 'write') =>
  driver.session({
    defaultAccessMode:
      mode === 'read'
        ? neo4j.session.READ
        : neo4j.session.WRITE
  })

export const closeDriver = async () => {
  await driver.close()
}
