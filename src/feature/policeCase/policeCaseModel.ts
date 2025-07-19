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

      if (label) {
        const data = {
          ...filterEmptyFields(rawData),
          name: label, // ✅ เพิ่ม field name แบบ static
        };

        if (Object.keys(data).length > 0) {
          const cypherFields = Object.keys(data)
            .map((key) => `${key}: $${key}`)
            .join(", ");

          const query = `
            CREATE (n:${label} {
              ${cypherFields}
            })
          `;

          await session.run(query, data);
        }
      }
    }
  } catch (error) {
    console.error("Neo4j CREATE error:", error);
    throw error;
  } finally {
    await session.close();
  }
};
