export const concatTables = (tables: { name: string; rows?: string[][] }[]) => {
  const columnIndices: { [key: string]: number } = {};
  let i = 1;
  for (const { rows } of tables) {
    if (rows) {
      for (const columnName of rows[0]) {
        if (!columnIndices[columnName]) {
          columnIndices[columnName] = i;
          i++;
        }
      }
    }
  }

  const resRows: string[][] = [["file name", ...Object.keys(columnIndices)]];

  for (const { name, rows } of tables) {
    if (rows) {
      for (let i = 1; i < rows.length; i++) {
        const row: string[] = Array(resRows[0].length).fill('');
        row[0] = name;
        for (let j = 0; j < rows[0].length; j++) {
          row[columnIndices[rows[0][j]]] = rows[i][j];
        }
        resRows.push(row);
      }
    }
  }

  return resRows;
};
