import { existsSync, writeFileSync, readFileSync } from "fs";
import { Embedding, EmbeddingModel, OpenAIEmbedding } from "./types";
import { getEscapedCell, getHash, getEnv, getChunks } from "./utils";

type ResponseEmbedding = {
  columnName: string;
  target: string;
  path: string;
  cached: boolean;
  index: number;
  embedding?: number[];
};

type RequestGroupEmbedding = {
  remote: ResponseEmbedding[];
  local: ResponseEmbedding[];
};

const getRequests = (
  columnNames: readonly string[] | string[],
  model: EmbeddingModel
): RequestGroupEmbedding => {
  const all = columnNames.map((columnName, index) => {
    const target = getEscapedCell(columnName);
    const path = "./cache/" + model + "/" + getHash(target);
    const cached = existsSync(path);
    return { columnName, target, path, cached, index };
  });
  const grouped = all.reduce(
    (acc, cur) => {
      if (cur.cached) {
        acc.local.push(cur);
      } else {
        acc.remote.push(cur);
      }
      return acc;
    },
    {
      remote: [],
      local: [],
    } as RequestGroupEmbedding
  );
  return grouped;
};

const _getEmbeddings = async (
  columnNames: readonly string[] | string[],
  model: EmbeddingModel
) => {
  const { remote, local } = getRequests(columnNames, model);
  const responses: ResponseEmbedding[] = [];

  if (remote.length) {
    const input = remote.map((r) => r.target);
    console.log("fetching embeddings: " + input);
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        authorization: "Bearer " + getEnv().OPENAIKEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        input,
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
      writeFileSync(remote[d.index].path, JSON.stringify(d), {
        encoding: "utf-8",
      });
    }

    for (let i = 0; i < remote.length; i++) {
      const { embedding } = data[i];
      responses.push({ ...remote[i], embedding });
    }
  }

  if (local.length) {
    for (const r of local) {
      const { embedding }: OpenAIEmbedding = JSON.parse(
        readFileSync(r.path, { encoding: "utf-8" })
      );
      responses.push({ ...r, embedding });
    }
  }

  responses.sort((a, z) => a.index - z.index);
  return responses;
};

export const getEmbeddings = async (
  columnNames: readonly string[] | string[],
  model: EmbeddingModel
) => {
  const cleanColumns = columnNames.map(c => !!c ? c : "nax")
  const embeddings: Embedding[] = [];
  const chunks = getChunks(cleanColumns as string[], 5);
  for (const chunk of chunks) {
    const next = await _getEmbeddings(chunk, model);
    if (next.length !== chunk.length) {
      throw new Error("missing embeddings");
    }
    embeddings.push(...(next as Embedding[]));
  }
  return embeddings;
};