import { getEmbeddings } from "./get-embeddings";
import { getFunctionClassifications } from "./get-function-classifications";
import { ChatCompletion, Classifier, Classifiers, CompletionModel, Embedding, EmbeddingModel } from "./types";
import { getCosineSimilarity } from "./utils";

const classifyTableEmbeddings = async (
  table: string[][],
  classifiers: Classifiers<string>
) => {
  const classifiedTable: string[][] = JSON.parse(JSON.stringify(table));
  const [header, ...rows] = classifiedTable;

  type MostSimilar = { centroid: Embedding; similarity: number } | undefined;
  const classifications: {
    [rowI: string]: { [targetColumn: string]: MostSimilar };
  } = {};
  for (let i = 0; i < rows.length; i++) {
    classifications[i] = {};
  }

  for (const classification of classifiers) {
    const classificationCentroids = await getEmbeddings(
      classification.classifications,
      classification.model as EmbeddingModel
    );

    const labeledRows: string[] = [];
    const rowLabelI = header.indexOf(classification.srcColumn);
    if (rowLabelI === -1) {
      const msg = `srcColumn: ${
        classification.srcColumn
      } not found in header: ${JSON.stringify(header)}`;
      console.error(msg);
      throw new Error(msg);
    }
    for (const row of rows) {
      labeledRows.push(row[rowLabelI]);
    }
    const rowEmbeddings = await getEmbeddings(
      labeledRows,
      classification.model as EmbeddingModel
    );

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
      classifications[rowI][classification.targetColumn] = mostSimilar;
    }
  }

  const deleteColumnIndices = classifiers
    .map(({ targetColumn }) =>
      header.findIndex((columnName) => targetColumn === columnName)
    )
    .filter((i) => i >= 0);

  classifiedTable.forEach((row) => {
    deleteColumnIndices.forEach((i) => row.splice(i, 1));
  });

  for (const classification of classifiers) {
    classifiedTable[0].push(classification.targetColumn);
    classifiedTable[0].push(classification.targetColumn + ` confidence`);
  }

  for (const rowI of Object.keys(classifications)) {
    for (const targetColumn of Object.keys(classifications[rowI])) {
      const mostSimilar = classifications[rowI][targetColumn];
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

const classifyTableWithFunctions = async (
  table: string[][],
  classifiers: Classifiers<string>
) => {
  const classifiedTable: string[][] = JSON.parse(JSON.stringify(table));
  const [header, ...rows] = classifiedTable;

  const deleteColumnIndices = classifiers
    .map(({ targetColumn }) =>
      header.findIndex((columnName) => targetColumn === columnName)
    )
    .filter((i) => i >= 0);

  classifiedTable.forEach((row) => {
    deleteColumnIndices.forEach((i) => row.splice(i, 1));
  });

  for (const classification of classifiers) {
    const srcColumnIndex = header.indexOf(classification.srcColumn);
    if (srcColumnIndex < 0) {
      throw new Error("cant find src column of classifier " + classification);
    }
    const cellsToClassify = rows.map((r) => r[srcColumnIndex]);
    const classifications = await getFunctionClassifications(
      cellsToClassify,
      classification.classifications,
      classification.model as CompletionModel,
      classification.completionSystemPrompt
    );

    header.push(classification.targetColumn);
    header.push(classification.targetColumn + ' confidence');

    for (let i = 0; i < rows.length; i++) {
      rows[i][header.length - 2] = classifications[i];
      rows[i][header.length - 1] = ".0";
    }
  }

  return classifiedTable;
};

export const classifyTable = async (
  table: string[][],
  classifiers: Classifier<string>
) => {
  if (classifiers.model.includes("embedding")) {
    return classifyTableEmbeddings(table, [classifiers]);
  } else {
    return classifyTableWithFunctions(table, [classifiers]);
  }
};
