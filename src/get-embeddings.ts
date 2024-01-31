import { existsSync, readFile, writeFile } from "fs";

type Embedding = {
  object: "embedding";
  embedding: number[];
  index: number;
};

const getOpenAiKey = () => {
  const res = process.env.OPENAIKEY;
  if (!res) {
    throw new Error("no open ai key in .env");
  }
  return res;
};

const model = "text-embedding-ada-002" // paid tier "text-embedding-3-small",

export const getEmbeddings = async (columnNames: string[]) => {
  const names = [...new Set<string>(columnNames.filter(s => !!s))]
    .map((target) => {
      const path = "../cache/" + model + "-" + target;
      return { target, cached: existsSync(path), path };
    });
  const cachedNames = names.filter((n) => n.cached);
  const newNames = names.filter((n) => !n.cached);

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      authorization: "Bearer " + getOpenAiKey(),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      input: newNames.map((n) => n.target),
      model, 
    }),
  });

  if (!res.ok) {
    throw new Error(res.status + " " + (await res.text()));
  }

  const {
    data,
  }: {
    object: "list";
    data: Embedding[];
  } = await res.json();

  await Promise.allSettled(
    data.map((d) => {
      return new Promise((resolve, reject) => {
        writeFile(names[d.index].path, JSON.stringify(d), (err) => {
          if (err) {
            reject(err);
          }
          resolve(undefined);
        });
      });
    })
  );

  const embeddings = data.map((d) => ({
    target: names[d.index].target,
    embedding: d.embedding,
  }));

  const cachedEmbeddings = await Promise.all(
    cachedNames.map(({ target, path }) => {
      return new Promise((resolve, reject) => {
        readFile(path, "utf-8", (err, data) => {
          if (err) {
            reject(err);
          }
          try {
            const { embedding }: Embedding = JSON.parse(data);
            resolve({ target, embedding });
          } catch (e) {
            reject(e);
          }
        });
      });
    })
  );

  embeddings.push(...(cachedEmbeddings as typeof embeddings));
};
