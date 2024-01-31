export const parseCsv = (csv: string) => {
  if (!csv) return;
  const rows: string[][] = [];

  for (const line of csv.split("\n")) {
    if (!line.includes(",")) {
      if (!rows.length) {
        // omit headers
        continue;
      }
      // omit footers
      break;
    }

    let col = "";
    let isEscaping = false;
    const row: string[] = [];
    const appendSb = () => {
      row.push(
        col
          .replace(/\s+/g, " ")
          .replace(/"([^"]*)"/g, (_, s) => `"${s.trim()}"`)
          .trim()
          .toLowerCase()
      );
      col = "";
      isEscaping = false;
    };

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === "," && !isEscaping) {
        appendSb();
        continue;
      }
      if (char === '"') {
        isEscaping = !isEscaping;
      }
      col += char;
      if (i === line.length - 1) {
        appendSb();
      }
    }

    rows.push(row);
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
