import { classifyTable } from "./operation-classify-table";
import { coalesceTable } from "./operation-coalesce-table";
import { reduceTable } from "./operation-reduce-table";
import { sortTable } from "./operation-sort-table";
import { transformTable } from "./operation-transform-table";
import { unionTables } from "./operation-union-tables";
import { readTableOrTables, writeCsv } from "./utils-fs";
import { Operation } from "./types";

export const unifySemanticSchema = async (operations: Operation[]) => {
  let next: string[][] | undefined;
  for (const operation of operations) {
    const { src, target, name, arg } = operation;
    const tables: any = await readTableOrTables(src);

    if (name === "classify") {
      next = await classifyTable(tables, arg);
    } else if (name === "coalesce") {
      next = await coalesceTable(tables, arg);
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

    if (Array.isArray(target)) {
      for (const t of target) {
        await writeCsv(next, t);
      }
    } else {
      await writeCsv(next, target);
    }
  }
};
