import { readFile, readdirSync, existsSync, unlinkSync, writeFile } from "fs";
import { join } from "path";

export const getFileData = async (name: string) => {
  console.log("reading: " + name);
  return new Promise<string>((resolve, reject) => {
    readFile(name, "utf-8", (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
};

export const getFileNames = (dir: string) => {
  return readdirSync(dir, "utf-8");
};

export const readTableOrTables = async <Src extends string | string[]>(
  src: Src
): Promise<Src extends string ? string[][] : string[][][]> => {
  if (
    typeof src === "string" &&
    src[src.length - 1] !== "/" &&
    src[src.length - 1] !== "\\"
  ) {
    const file = await getFileData(src as string);
    return parseCsv(file) as any;
  } else if (
    typeof src === "string" &&
    (src[src.length - 1] === "/" || src[src.length - 1] === "\\")
  ) {
    const fileNames = await getFileNames(src as string);
    const files: string[] = [];
    for (const name of fileNames) {
      const file = await getFileData(join(src as string, name));
      if (file) {
        files.push(file);
      } else {
        console.log("empty file: " + name);
      }
    }
    return files.map((csv) => parseCsv(csv)) as any;
  } else if (Array.isArray(src)) {
    const files: string[] = [];
    for (const name of src) {
      const file = await getFileData(name);
      if (file) {
        files.push(file);
      } else {
        console.log("empty file: " + name);
      }
    }
    return files.map((csv) => parseCsv(csv)) as any;
  }
  throw new Error("unknown src " + src);
};

export const writeCsv = async (rows: string[][], path: string) => {
  if (existsSync(path)) {
    unlinkSync(path);
  }

  const fileContent = rows.map((row) => row.join(",") + "\n").join("");

  return await new Promise((resolve, reject) => {
    console.log("writing: " + path);
    writeFile(path, fileContent, "utf-8", (err) => {
      if (err) {
        reject(err);
      }
      resolve(undefined);
    });
  });
};

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
