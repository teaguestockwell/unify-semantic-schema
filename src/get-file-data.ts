import { existsSync, readFile, unlinkSync, writeFile } from "fs";
import { getFileNames } from "./get-file-names";
import { parseCsv } from "./parse-csv";
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
