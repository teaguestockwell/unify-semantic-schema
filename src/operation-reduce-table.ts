import { Reducer } from "./types";

export const reduceTable = <T>(
  table: string[][],
  reducer: Reducer<unknown[][]>
): string[][] => {
  try {
    const acc = table.reduce(reducer.fn, reducer.initialAccumulator);
    const res: string[][] = [];
    for (const row of acc) {
      const next: string[] = [];
      for (const cell of row) {
        next.push((cell as any).toString());
      }
      res.push(next);
    }
    return res;
  } catch (e) {
    console.error(`reducer threw and error ` + e);
    throw e;
  }
};
