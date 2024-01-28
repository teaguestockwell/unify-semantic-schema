import { getFileData } from "./get-file-data";
import { cleanCsv } from "./clean-csv";
import { getFileNames } from "./get-file-names";
import { concatTables } from "./concat-tables";
import { writeCsv } from "./write-csv";

const main = async () => {
  const dir = "data";
  const fileNames = await getFileNames(dir);
  const rawFiles: { name: string; data: string }[] = [];
  await Promise.allSettled(
    fileNames.map(async (name) => {
      const data = await getFileData(name, dir);
      rawFiles.push({ name, data });
    })
  );
  const tables = rawFiles.map(({ name, data }) => ({
    name,
    rows: cleanCsv(data),
  }));
  const table = concatTables(tables);
  await writeCsv(table, "./out.csv")
};

main().catch(console.error);
