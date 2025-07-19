import { getSession } from '../../utils/neo4j'
import { Path, int as neo4jInt } from 'neo4j-driver'

export async function getRelatedCases(limit: number = 25) {
  const session = getSession('read')

  try {
    const result = await session.run(
      `
      MATCH p=()-[:RELATED_TO]->() 
      RETURN p 
      LIMIT $limit
      `,
      { limit: neo4jInt(Math.floor(limit)) }
    )

    

    const cases = result.records.map(record => {
      const path = record.get('p') as Path

      return {
        nodes: path.segments.map(seg => seg.start.properties).concat(path.end.properties),
        relationships: path.segments.map(seg => ({
          ...seg.relationship.properties,
          type: seg.relationship.type
        }))
      }
    })
    
    return cases

  } catch (err) {
    console.error('Neo4j query error:', err)
    throw err
  } finally {
    await session.close()
  }
}
