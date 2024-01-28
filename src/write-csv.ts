import { createWriteStream, existsSync, unlinkSync } from "fs";

export const writeCsv = async (
  rows: string[][],
  path: string
) => {
  if (existsSync(path)) {
    unlinkSync(path)
  }

  const fileStream = createWriteStream(path);

  await Promise.all(
    rows.map((row) => {
      return new Promise((resolve, reject) => {
        fileStream.write(row.join(",") + "\n", (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(undefined);
          }
        });
      });
    })
  );

  return await new Promise((resolve) => {
    fileStream.end(() => {
      resolve(undefined);
    });
  });
};
