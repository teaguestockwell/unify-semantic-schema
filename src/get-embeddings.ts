import { existsSync, readFileSync, writeFileSync } from "fs";
import { Embedding, EmbeddingModel, Model, OpenAIEmbedding } from "./types";
import { getEnv } from "./get-env";
import { getChunks } from "./get-chunks";
import { getEscapedCell } from "./get-escaped-cell";
import { getHash } from "./get-hash";

type Response = {
  columnName: string;
  target: string;
  path: string;
  cached: boolean;
  index: number;
  embedding?: number[];
};

type RequestGroup = { remote: Response[]; local: Response[] };

const getRequests = (
  columnNames: readonly string[] | string[],
  model: EmbeddingModel
): RequestGroup => {
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
    } as RequestGroup
  );
  return grouped;
};

export const _getEmbeddings = async (
  columnNames: readonly string[] | string[],
  model: EmbeddingModel
) => {
  const { remote, local } = getRequests(columnNames, model);
  const responses: Response[] = [];

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
    embeddings.push(...(next as Embedding[]));
  }
  return embeddings;
};
