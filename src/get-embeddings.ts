import { existsSync, readFile, writeFile } from "fs";
import { Embedding, OpenAIEmbedding } from "./types";

const getOpenAiKey = () => {
  const res = process.env.OPENAIKEY;
  if (!res) {
    throw new Error("no open ai key in .env");
  }
  return res;
};

const model:
  | "text-embedding-ada-002"
  | "text-embedding-3-small"
  | "text-embedding-3-large" = "text-embedding-3-large";

export const getEmbeddings = async (columnNames: string[]) => {
  const requests = [...new Set(columnNames)].map((s) => {
    const columnName = s;
    const target = (() => {
      if (s[0] === `"` && s[s.length - 1] === `"`) {
        return s.substring(1, s.length - 1);
      }
      return s;
    })();
    const path = "./cache/" + model + "/" + encodeURIComponent(target);
    const cached = existsSync(path);
    return { columnName, target, path, cached };
  });
  const localRequest = requests.filter((n) => n.cached);
  const remoteRequests = requests.filter((n) => !n.cached);
  const localTargets = localRequest.map((s) => s.target);
  const remoteTargets = remoteRequests.map((s) => s.target);

  console.log({ remoteTargets });

  const embeddings: Embedding[] = [];

  if (remoteRequests.length) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        authorization: "Bearer " + getOpenAiKey(),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        input: remoteTargets,
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
      data: OpenAIEmbedding[];
    } = await res.json();

    await Promise.all(
      data.map((d) => {
        return new Promise((resolve, reject) => {
          writeFile(remoteRequests[d.index].path, JSON.stringify(d), (err) => {
            if (err) {
              reject(err);
            }
            resolve(undefined);
          });
        });
      })
    );
    embeddings.push(
      ...data.map((d) => ({
        target: remoteRequests[d.index].target,
        embedding: d.embedding,
        columnName: remoteRequests[d.index].columnName,
      }))
    );
  }

  const cachedEmbeddings = await Promise.all(
    localRequest.map(({ target, path, columnName }) => {
      return new Promise((resolve, reject) => {
        readFile(path, "utf-8", (err, data) => {
          if (err) {
            reject(err);
          }
          try {
            const { embedding }: OpenAIEmbedding = JSON.parse(data);
            resolve({ target, embedding, columnName } satisfies Embedding);
          } catch (e) {
            reject(e);
          }
        });
      });
    })
  );

  embeddings.push(...(cachedEmbeddings as typeof embeddings));

  return embeddings;
};
