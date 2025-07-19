import { getSession } from "../../utils/neo4j";
import { Path, int as neo4jInt } from "neo4j-driver";
import { convertNeo4jValue } from "../../utils/neo4j";
import * as nodeType from "../../utils/type";
import { filterEmptyFields } from "../../utils/filterQuery"

export async function getRelatedCases() {
  const session = getSession("write");

  try {
    const result = await session.run(
      `
     MATCH p=()-[:MATCHED_ON]->() 
     RETURN p;
      `
    );

    const cases = result.records.map((record) => {
      const path = record.get("p") as Path;

      return {
        nodes: path.segments
          .map((seg) => [seg.start.properties, seg.end.properties])
          .flat()
          .map(convertNeo4jValue),

        relationships: path.segments.map((seg) =>
          convertNeo4jValue({
            ...seg.relationship.properties,
            type: seg.relationship.type,
          })
        ),
      };
    });

    return cases;
  } catch (err) {
    console.error("Neo4j query error:", err);
    throw err;
  } finally {
    await session.close();
  }
}

export const createNode = async (nodeArray: nodeType.CaseDataArray) => {
  const session = getSession("write");

  try {
    for (const node of nodeArray) {
      let label = "";
      let rawData: any = {};

      if ("case" in node) {
        label = "Case";
        rawData = node.case;
      } else if ("victim" in node) {
        label = "Victim";
        rawData = node.victim;
      } else if ("suspect" in node) {
        label = "Suspect";
        rawData = node.suspect;
      } else if ("phone" in node) {
        label = "Phone";
        rawData = node.phone;
      } else if ("bank_account" in node) {
        label = "BankAccount";
        rawData = node.bank_account;
      } else if ("link" in node) {
        label = "Link";
        rawData = node.link;
      }

      const filtered = filterEmptyFields(rawData);

      if (label && Object.keys(filtered).length > 0) {
        const data = {
          ...filtered,
          name: label,
        };

        // ==== 🔍 Step 1: Check for duplicate node
        const matchQuery = `
          MATCH (n:${label})
          WHERE ${Object.keys(data)
            .map((key) => `n.${key} = $${key}`)
            .join(" AND ")}
          RETURN COUNT(*) as count
        `;

        const result = await session.run(matchQuery, data);
        const count = result.records[0].get("count").toNumber();

        if (count === 0) {
          // ==== ✅ Step 2: Create only if not exists
          const cypherFields = Object.keys(data)
            .map((key) => `${key}: $${key}`)
            .join(", ");

          const createQuery = `
            CREATE (n:${label} {
              ${cypherFields}
            })
          `;

          await session.run(createQuery, data);
        }
      }
    }

    const relQuery = `
        // === CASE → Victim
    MATCH (c:Case), (v:Victim)
    FOREACH (_ IN CASE WHEN c.user_id = v.user_id AND c.user_id IS NOT NULL THEN [1] ELSE [] END |
    MERGE (c)-[:HAS_VICTIM]->(v)
    )
    WITH *

    // === CASE → Suspect
    MATCH (c:Case), (s:Suspect)
    FOREACH (_ IN CASE WHEN c.suspect_name = s.suspect_name AND c.suspect_name IS NOT NULL AND c.suspect_name <> "" THEN [1] ELSE [] END |
    MERGE (c)-[:HAS_SUSPECT]->(s)
    )
    WITH *

    // === CASE → Phone
    MATCH (c:Case), (p:Phone)
    FOREACH (_ IN CASE WHEN c.sus_tel = p.sus_tel AND c.sus_tel IS NOT NULL THEN [1] ELSE [] END |
    MERGE (c)-[:HAS_PHONE]->(p)
    )
    WITH *

    // === CASE → BankAccount
    MATCH (c:Case), (b:BankAccount)
    FOREACH (_ IN CASE WHEN c.sus_bank_account_number = b.sus_bank_account_number AND c.sus_bank_account_number IS NOT NULL THEN [1] ELSE [] END |
    MERGE (c)-[:HAS_BANK_ACCOUNT]->(b)
    )
    WITH *

    // === CASE → Link
    MATCH (c:Case), (l:Link)
    FOREACH (_ IN CASE WHEN c.link = l.link AND c.link IS NOT NULL AND c.link <> "" THEN [1] ELSE [] END |
    MERGE (c)-[:HAS_LINK]->(l)
    )
    WITH *

    // === CASE ↔ CASE
    MATCH (c1:Case), (c2:Case)
    WHERE c1.case_id <> c2.case_id
    FOREACH (_ IN CASE WHEN c1.user_id = c2.user_id AND c1.user_id IS NOT NULL THEN [1] ELSE [] END |
    MERGE (c1)-[:SAME_USER]->(c2)
    )
    FOREACH (_ IN CASE WHEN c1.suspect_name = c2.suspect_name AND c1.suspect_name IS NOT NULL AND c1.suspect_name <> "" THEN [1] ELSE [] END |
    MERGE (c1)-[:SAME_SUSPECT]->(c2)
    )
    FOREACH (_ IN CASE WHEN c1.sus_tel = c2.sus_tel AND c1.sus_tel IS NOT NULL THEN [1] ELSE [] END |
    MERGE (c1)-[:SAME_PHONE]->(c2)
    )
    FOREACH (_ IN CASE WHEN c1.sus_bank_account_number = c2.sus_bank_account_number AND c1.sus_bank_account_number IS NOT NULL THEN [1] ELSE [] END |
    MERGE (c1)-[:SAME_BANK]->(c2)
    )
    FOREACH (_ IN CASE WHEN c1.link = c2.link AND c1.link IS NOT NULL AND c1.link <> "" THEN [1] ELSE [] END |
    MERGE (c1)-[:SAME_LINK]->(c2)
    )
    WITH *

    // === SUSPECT → PHONE
    MATCH (s:Suspect), (p:Phone)
    FOREACH (_ IN CASE WHEN s.sus_tel = p.sus_tel AND s.sus_tel IS NOT NULL THEN [1] ELSE [] END |
    MERGE (s)-[:HAS_PHONE]->(p)
    )
    WITH *


    // === SUSPECT → BANK
    MATCH (s:Suspect), (b:BankAccount)
    FOREACH (_ IN CASE WHEN s.sus_bank_account_number = b.sus_bank_account_number AND s.sus_bank_account_number IS NOT NULL THEN [1] ELSE [] END |
    MERGE (s)-[:HAS_BANK_ACCOUNT]->(b)
    )
    WITH *


    MATCH (s:Suspect), (l:Link)
    FOREACH (_ IN CASE WHEN s.link = l.link AND s.link IS NOT NULL AND s.link <> "" THEN [1] ELSE [] END |
    MERGE (s)-[:HAS_LINK]->(l)
    )



    `;

    await session.run(relQuery);

    return { success: true };
  } catch (error) {
    console.error("CREATE NODE + RELATION ERROR:", error);
    throw error;
  } finally {
    await session.close();
  }
};

