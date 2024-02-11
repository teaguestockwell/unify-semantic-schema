import { getFileData } from "./get-file-data";
import { parseCsv } from "./parse-csv";
import { getFileNames } from "./get-file-names";
import { unionTables } from "./union-tables";
import { writeCsv } from "./write-csv";
import { getEmbeddings } from "./get-embeddings";
import {
  classifyTable,
  classifyTableWithFunctions,
  coalesceTable,
  reduceTable,
  sortTable,
  transformTable,
} from "./transform-table";
import {
  centroids,
  transformers,
  comparators,
  classifiers,
  reducers,
  classifiersFunction,
} from "./config";
import { Reducer } from "./types";
import { getFunctionClassifications } from "./get-function-classification";

const main = async () => {
  const dir = "data";
  const fileNames = await getFileNames(dir);
  const rawFiles: { name: string; data: string }[] = [];
  await Promise.allSettled(
    fileNames.map(async (name) => {
      const data = await getFileData(name, dir);
      rawFiles.push({ name, data });
    })
  );
  const tables = rawFiles.map(({ name, data }) => ({
    name,
    rows: parseCsv(data),
  }));

  const unioned = unionTables(tables);
  const coalesced = await coalesceTable(unioned, centroids, getEmbeddings);
  const classified = await classifyTable(coalesced, classifiers, getEmbeddings);
  // const classified2 = await classifyTableWithFunctions(
  //   coalesced.slice(0, 30),
  //   classifiersFunction,
  //   getFunctionClassifications
  // );
  const transformed = transformTable(classified, transformers);
  const sorted = sortTable(transformed, comparators);
  const reduced = reduceTable(sorted, reducers as Array<Reducer<unknown>>);

  await Promise.all([
    writeCsv(unioned, "./out/unioned.csv"),
    writeCsv(coalesced, "./out/coalesced.csv"),
    writeCsv(classified, "./out/classified.csv"),
    // writeCsv(classified2, "./out/classified2.csv"),
    writeCsv(transformed, "./out/transformed.csv"),
    writeCsv(sorted, "./out/sorted.csv"),
    writeCsv(reduced, "./out/reduced.csv"),
  ]);
};

main().catch(console.error);
