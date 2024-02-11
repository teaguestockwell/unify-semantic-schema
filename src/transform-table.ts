import { Classifiers, Comparator, Embedding, GetEmbeddings } from "./types";
import { getCentroidCoalesceCluster } from "./get-centroid-coalesce-cluster";
import { getCosineSimilarity } from "./get-cosign-similarity";

export const classifyTable = async (
  table: string[][],
  classifiers: Classifiers<string>,
  getEmbeddings: GetEmbeddings
) => {
  const classifiedTable: string[][] = JSON.parse(JSON.stringify(table));
  const [header, ...rows] = classifiedTable;
  const model = "text-embedding-3-small";

  type MostSimilar = { centroid: Embedding; similarity: number } | undefined;
  const classifications: {
    [rowI: string]: { [targetColumnName: string]: MostSimilar };
  } = {};
  for (let i = 0; i < rows.length; i++) {
    classifications[i] = {};
  }

  for (const classification of classifiers) {
    const classificationCentroids = await getEmbeddings(
      classification.centroids,
      model
    );

    const labeledRows: string[] = [];
    const rowLabelI = header.indexOf(classification.srcColumnName);
    if (rowLabelI === -1) {
      throw new Error("srcColumnName not found - please ensure its a centroid");
    }
    for (const row of rows) {
      labeledRows.push(row[rowLabelI]);
    }
    const rowEmbeddings = await getEmbeddings(labeledRows, model);

    for (let rowI = 0; rowI < rows.length; rowI++) {
      let mostSimilar: MostSimilar;
      for (const centroid of classificationCentroids) {
        const similarity = getCosineSimilarity(
          rowEmbeddings[rowI].embedding,
          centroid.embedding
        );
        if (!mostSimilar || mostSimilar.similarity < similarity) {
          mostSimilar = { similarity, centroid };
        }
      }
      classifications[rowI][classification.targetColumnName] = mostSimilar;
    }
  }

  const deleteColumnIndices = classifiers
    .map(({ targetColumnName }) =>
      header.findIndex((columnName) => targetColumnName === columnName)
    )
    .filter((i) => i >= 0);

  classifiedTable.forEach((row) => {
    deleteColumnIndices.forEach((i) => row.splice(i, 1));
  });

  for (const classification of classifiers) {
    classifiedTable[0].push(classification.targetColumnName);
    classifiedTable[0].push(classification.targetColumnName + " confidence");
  }

  for (const rowI of Object.keys(classifications)) {
    for (const targetColumnName of Object.keys(classifications[rowI])) {
      const mostSimilar = classifications[rowI][targetColumnName];
      if (mostSimilar) {
        classifiedTable[+rowI + 1].push(mostSimilar.centroid.columnName);
        classifiedTable[+rowI + 1].push(
          mostSimilar.similarity.toFixed(3).replace("0.", ".")
        );
      } else {
        classifiedTable[+rowI + 1].push("");
        classifiedTable[+rowI + 1].push("");
      }
    }
  }

  return classifiedTable;
};

export const coalesceTable = async (
  table: string[][],
  centroids: string[] | readonly string[],
  getEmbeddings: GetEmbeddings
) => {
  const [header] = table;
  const model = "text-embedding-3-large";
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

export const transformTable = (
  table: string[][],
  txMap: { [centroid: string]: (s: string) => string }
) => {
  const transformedTabled = [[...table[0]]];
  for (let rowIndex = 1; rowIndex < table.length; rowIndex++) {
    const transformedRow = new Array<string>(table[0].length);
    for (let columnIndex = 0; columnIndex < table[0].length; columnIndex++) {
      const txCell = txMap[table[0][columnIndex]];
      const cell = table[rowIndex][columnIndex];
      transformedRow[columnIndex] = txCell ? txCell(cell) : cell;
    }
    transformedTabled[rowIndex] = transformedRow;
  }
  return transformedTabled;
};

export const sortTable = (table: string[][], comparators: Comparator[]) => {
  const [header, ...rows] = table;
  const sortedTable: string[][] = JSON.parse(JSON.stringify(rows));
  const columnNamesToIndex: { [columnName: string]: number } = {};
  for (
    let columnNameIndex = 0;
    columnNameIndex < table[0].length;
    columnNameIndex++
  ) {
    const columnName = table[0][columnNameIndex];
    columnNamesToIndex[columnName] = columnNameIndex;
  }

  sortedTable.sort((rowA, rowZ) => {
    for (const { centroid, comparator } of comparators) {
      const idx = columnNamesToIndex[centroid];
      const res = comparator(rowA[idx], rowZ[idx]);
      if (res !== 0) return res;
    }
    return 0;
  });

  sortedTable.unshift(header);
  return sortedTable;
};
