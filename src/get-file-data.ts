import { readFile } from "fs";
import { join } from "path";

export const getFileData = async (name: string, path: string) => {
  return new Promise<string>((resolve, reject) => {
    readFile(join(path, name), "utf-8", (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
};
