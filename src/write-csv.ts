import { existsSync, unlinkSync, writeFile } from "fs";

export const writeCsv = async (rows: string[][], path: string) => {
  if (existsSync(path)) {
    unlinkSync(path);
  }

  const fileContent = rows.map((row) => row.join(",") + "\n").join("");

  return await new Promise((resolve, reject) => {
    writeFile(path, fileContent, "utf-8", (err) => {
      if (err) {
        reject(err);
      }
      resolve(undefined);
    });
  });
};
