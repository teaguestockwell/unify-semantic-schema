export const coalesceTable = (
  table: string[][],
  coalescedColumnNameToChildColumnNames: {
    [coalescedColumnName: string]: string[];
  }
) => {
  const coalescedTable = [Object.keys(coalescedColumnNameToChildColumnNames)];
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
      const coalescedColumnName = coalescedTable[0][coalescedColumnIndex];
      for (const childColumnName of coalescedColumnNameToChildColumnNames[
        coalescedColumnName
      ]) {
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
  txMap: { [coalescedColumnName: string]: (s: string) => string }
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

export const sortTable = (
  table: string[][],
  comparators: {
    coalescedColumnName: string;
    comparator: (a: string, z: string) => number;
  }[]
) => {
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
    for (const { coalescedColumnName, comparator } of comparators) {
      const idx = columnNamesToIndex[coalescedColumnName];
      const res = comparator(rowA[idx], rowZ[idx]);
      if (res !== 0) return res;
    }
    return 0;
  });

  sortedTable.unshift(header);
  return sortedTable;
};
