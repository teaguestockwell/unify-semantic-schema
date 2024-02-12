import { Transformers } from "./types";
import { getEscapedCell } from "./utils";

export const transformTable = (table: string[][], txMap: Transformers) => {
  const transformedTabled = [[...table[0]]];
  for (let rowIndex = 1; rowIndex < table.length; rowIndex++) {
    const transformedRow = new Array<string>(table[0].length);
    for (let columnIndex = 0; columnIndex < table[0].length; columnIndex++) {
      const txCell = txMap[table[0][columnIndex]];
      const cell = table[rowIndex][columnIndex];
      transformedRow[columnIndex] = txCell
        ? txCell(getEscapedCell(cell))
        : cell;
    }
    transformedTabled[rowIndex] = transformedRow;
  }
  return transformedTabled;
};
