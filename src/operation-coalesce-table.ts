import { getEmbeddings } from "./get-embeddings";
import { CentroidCoalesceMap, Coalesce, Embedding } from "./types";
import { getCosineSimilarity } from "./utils";

export const getCentroidCoalesceCluster = (
  columns: Embedding[],
  centroids: Embedding[]
) => {
  type Comparison = {
    column: Embedding;
    centroid: Embedding;
    similarity: number;
  };
  const map: {
    [column: string]: { [centroid: string]: Comparison };
  } = {};
  for (const column of columns) {
    map[column.columnName] = {};
    for (const centroid of centroids) {
      map[column.columnName][centroid.columnName] = {
        column,
        centroid,
        similarity: getCosineSimilarity(column.embedding, centroid.embedding),
      };
    }
  }

  const clusters: { [centroid: string]: Comparison[] } = {};
  const coalesceMap: CentroidCoalesceMap = {};
  for (const centroid of centroids) {
    clusters[centroid.columnName] = [];
    coalesceMap[centroid.columnName] = [];
  }

  for (const column of columns) {
    let closest: Comparison | undefined;
    for (const centroid of centroids) {
      const next = map[column.columnName][centroid.columnName];
      if (!closest || closest.similarity < next.similarity) {
        closest = next;
      }
    }
    if (closest) {
      clusters[closest.centroid.columnName].push(closest);
    }
  }

  for (const centroid of centroids) {
    clusters[centroid.columnName].sort((a, z) => z.similarity - a.similarity);
  }

  for (const centroid of centroids) {
    for (const comparison of clusters[centroid.columnName]) {
      coalesceMap[centroid.columnName].push(comparison.column.columnName);
    }
  }

  return coalesceMap;
};

export const coalesceTable = async (
  table: string[][],
  { model, centroids }: Coalesce
) => {
  const [header] = table;
  const columnNameEmbeddings = await getEmbeddings(header, model);
  const centroidEmbeddings = await getEmbeddings(centroids, model);
  const centroidToChildColumnNames = getCentroidCoalesceCluster(
    columnNameEmbeddings,
    centroidEmbeddings
  );
  const coalescedTable = [Object.keys(centroidToChildColumnNames)];
  const columnNamesToIndex: { [columnName: string]: number } = {};
  for (
    let columnNameIndex = 0;
    columnNameIndex < table[0].length;
    columnNameIndex++
  ) {
    const columnName = table[0][columnNameIndex];
    columnNamesToIndex[columnName] = columnNameIndex;
  }

  for (let rowIndex = 1; rowIndex < table.length; rowIndex++) {
    const row = table[rowIndex];
    const coalescedRow = new Array<string>(coalescedTable[0].length).fill("");
    for (
      let coalescedColumnIndex = 0;
      coalescedColumnIndex < coalescedTable[0].length;
      coalescedColumnIndex++
    ) {
      const centroid = coalescedTable[0][coalescedColumnIndex];
      for (const childColumnName of centroidToChildColumnNames[centroid]) {
        const childColumnIndex = columnNamesToIndex[childColumnName];
        const childColumnValue = row[childColumnIndex];
        if (childColumnValue !== undefined && childColumnValue !== "") {
          coalescedRow[coalescedColumnIndex] = childColumnValue;
          break;
        }
      }
    }
    coalescedTable.push(coalescedRow);
  }

  return coalescedTable;
};
