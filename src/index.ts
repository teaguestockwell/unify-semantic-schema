import { readTableOrTables, writeCsv } from "./get-file-data";
import { unionTables } from "./union-tables";
import { getEmbeddings } from "./get-embeddings";
import {
  classifyTable,
  coalesceTable,
  reduceTable,
  sortTable,
  transformTable,
} from "./transform-table";
import { operations } from "./config";
import { getFunctionClassifications } from "./get-function-classification";

const main = async () => {
  for (const operation of operations) {
    const { src, target, name, arg } = operation as any;

    const tables: any = await readTableOrTables(src);
    let next: string[][] | undefined;

    if (name === "classify") {
      next = await classifyTable(
        tables,
        arg,
        getEmbeddings,
        getFunctionClassifications
      );
    } else if (name === "coalesce") {
      next = await coalesceTable(
        tables,
        arg.centroids,
        getEmbeddings,
        arg.model
      );
    } else if (name === "sort") {
      next = sortTable(tables, arg);
    } else if (name === "summarize") {
      next = reduceTable(tables, arg);
    } else if (name === "transform") {
      next = transformTable(tables, arg);
    } else if (name === "union") {
      next = unionTables(tables);
    }

    if (!next) {
      throw new Error("operation did not create the next table");
    }

    await writeCsv(next, target);
  }
};

main().catch(console.error);
