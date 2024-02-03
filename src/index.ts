import { getFileData } from "./get-file-data";
import { parseCsv } from "./parse-csv";
import { getFileNames } from "./get-file-names";
import { unionTables } from "./union-tables";
import { writeCsv } from "./write-csv";
import { getEmbeddings } from "./get-embeddings";
import { coalesceTable, sortTable, transformTable } from "./transform-table";
import {
  sampleCoalesceMap,
  sampleComparators,
  sampleTxMap,
} from "./sample-transformers";

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
  const embeddings = await getEmbeddings(tables.flatMap((t) => t.rows?.[0] ?? []));
  const unioned = unionTables(tables);
  const coalesced = coalesceTable(unioned, sampleCoalesceMap);
  const transformed = transformTable(coalesced, sampleTxMap);
  const sorted = sortTable(transformed, sampleComparators);
  await Promise.all([
    writeCsv(unioned, "./out/unioned.csv"),
    writeCsv(coalesced, "./out/coalesced.csv"),
    writeCsv(transformed, "./out/transformed.csv"),
    writeCsv(sorted, "./out/sorted.csv"),
  ]);
};

main().catch(console.error);
