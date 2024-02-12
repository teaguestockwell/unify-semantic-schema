import { CentroidCoalesceMap, Embedding } from "./types";
import { getCosineSimilarity } from "./get-cosign-similarity";

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
