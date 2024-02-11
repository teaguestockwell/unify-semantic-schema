import { existsSync, readFileSync, writeFileSync } from "fs";
import { Embedding, OpenAIEmbedding } from "./types";
import { getEnv } from "./get-env";
import { createHash } from "crypto";
import { getChunks } from "./get-chunks";

type Model =
  | "text-embedding-ada-002"
  | "text-embedding-3-small"
  | "text-embedding-3-large";

const hash = (s: string) => {
  const hash = createHash("md5");
  hash.update(s);
  return hash.digest("hex");
};

export const _getEmbeddings = async (
  columnNames: readonly string[] | string[],
  model: Model
) => {
  const requests = columnNames.map((s) => {
    const columnName = s;
    const target = (() => {
      if (s[0] === `"` && s[s.length - 1] === `"`) {
        return s.substring(1, s.length - 1);
      }
      return s;
    })();
    const path = "./cache/" + model + "/" + hash(target);
    const cached = existsSync(path);
    return { columnName, target, path, cached };
  });
  const localRequest = requests.filter((n) => n.cached);
  const remoteRequests = requests.filter((n) => !n.cached);
  const localTargets = localRequest.map((s) => s.target);
  const remoteTargets = remoteRequests.map((s) => s.target);

  if (remoteTargets.length) {
    console.log("remote target chars: " + remoteTargets.join("").length);
  }

  const embeddings: Embedding[] = [];

  if (remoteRequests.length) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        authorization: "Bearer " + getEnv().OPENAIKEY,
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

    for (const d of data) {
      writeFileSync(remoteRequests[d.index].path, JSON.stringify(d), {
        encoding: "utf-8",
      });
    }

    embeddings.push(
      ...data.map((d) => ({
        target: remoteRequests[d.index].target,
        embedding: d.embedding,
        columnName: remoteRequests[d.index].columnName,
      }))
    );
  }

  for (const { target, path, columnName } of localRequest) {
    try {
      const data = readFileSync(path, { encoding: "utf-8" });
      const { embedding }: OpenAIEmbedding = JSON.parse(data);
      embeddings.push({ target, embedding, columnName });
    } catch (e) {
      console.error("unable to read: ", { path, target, columnName });
      throw e;
    }
  }

  const order = requests.reduce((acc, cur, i) => {
    acc[cur.columnName] = i;
    return acc;
  }, {} as Record<string, number>);
  embeddings.sort((a, z) => {
    return order[a.columnName] - order[z.columnName];
  });

  return embeddings;
};

export const getEmbeddings = async (
  columnNames: readonly string[] | string[],
  model: Model
) => {
  console.log(columnNames);
  if (columnNames.includes("")) {
    throw new Error(
      "tried to get embedding of empty string, check the config for empty strings"
    );
  }
  const embeddings: Embedding[] = [];
  const chunks = getChunks(columnNames as string[], 5);
  for (const chunk of chunks) {
    const next = await _getEmbeddings(chunk, model);
    if (next.length !== chunk.length) {
      throw new Error("missing embeddings");
    }
    embeddings.push(...next);
  }
  return embeddings;
};
