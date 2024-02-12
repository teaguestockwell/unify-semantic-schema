import { Comparator } from "./types";

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
    for (const { column, comparator } of comparators) {
      const idx = columnNamesToIndex[column];
      const res = comparator(rowA[idx], rowZ[idx]);
      if (res !== 0) return res;
    }
    return 0;
  });

  sortedTable.unshift(header);
  return sortedTable;
};