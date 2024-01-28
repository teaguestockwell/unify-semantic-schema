export const cleanCsv = (csv: string) => {
  if (!csv) {
    return;
  }
  const rows: string[][] = [];

  // omit headers / footers and trim lines
  for (const row of csv.split("\n")) {
    if (!row.includes(",")) {
      if (!rows.length) {
        continue;
      }
      break;
    }

    rows.push([
      ...row
        .split(",")
        .map((c) => c.trim())
        .map((c) => {
          if (
            (c[0] === `"` && c[c.length - 1] === `"`) ||
            (c[0] === `'` && c[c.length - 1] === `'`)
          ) {
            return c.substring(1, c.length - 1);
          }
          return c;
        })
        .map((col) => col.trim())
        .map((col) => col.toLowerCase())
        .map((col) => col.replace(/\s+/g, ' '))
    ]);
  }

  // delete columns without data
  if (rows.length > 1) {
    const includedCols = Array(rows[0].length).fill(false);

    for (let i = 0; i < rows[0].length; i++) {
      for (let j = 1; j < rows.length; j++) {
        if (rows[j][i]) {
          includedCols[i] = true;
          break;
        }
      }
    }

    return rows.map((r) => r.filter((c, i) => includedCols[i]));
  }
};
