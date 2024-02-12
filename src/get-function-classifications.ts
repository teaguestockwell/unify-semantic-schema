import { existsSync, readFileSync, writeFileSync } from "fs";
import { ChatCompletion, CompletionModel } from "./types";
import { getEscapedCell, getHash, getEnv } from "./utils";

type ResponseFunction = {
  src: string;
  target: string;
  path: string;
  cached: boolean;
  index: number;
  classification: string;
};

type RequestGroupFunction = {
  remote: ResponseFunction[];
  local: ResponseFunction[];
};

const getClassificationFunctionDef = (centroids: string[]) => {
  return {
    type: "function",
    function: {
      name: "classify",
      parameters: {
        type: "object",
        required: ["id", "classification"],
        properties: {
          id: {
            type: "number",
          },
          classification: {
            type: "string",
            enum: centroids,
          },
        },
      },
    },
  };
};

const getFunctionClassificationsRemote = async (
  targets: string[],
  centroids: string[],
  model: CompletionModel,
  completionSystemPrompt = ""
): Promise<string[]> => {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: "Bearer " + getEnv().OPENAIKEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "classify user targets by calling the classify function. do not provide content in your response. do not make up your own enum for the classification. " +
            completionSystemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify(
            targets.map((target, id) => ({ target, id }))
          ),
        },
      ],
      tools: [getClassificationFunctionDef(centroids)],
    }),
  });

  if (!res.ok) {
    throw new Error(res.status + " " + (await res.text()));
  }

  const json: ChatCompletion = await res.json();
  console.log(json.usage);
  const args: { id: number; classification: string }[] = new Array(
    targets.length
  )
    .fill(0)
    .map((_, id) => ({ id, classification: "" }));

  if (json.choices?.[0]?.message?.tool_calls.length) {
    for (let i = 0; i < json.choices?.[0]?.message?.tool_calls.length; i++) {
      try {
        const arg = JSON.parse(
          json.choices[0].message.tool_calls[i].function?.arguments ?? {}
        );
        if (
          typeof arg.id !== "number" ||
          typeof arg.classification !== "string" ||
          !centroids.includes(arg.classification)
        ) {
          throw (
            "invalid function args: " +
            json.choices[0].message.tool_calls[i].function.arguments
          );
        }
        args[arg.id] = arg;
      } catch (e) {
        console.error(e);
        continue;
      }
    }
  }

  args.sort((a, z) => a.id - z.id);
  return args.map((arg) => arg.classification);
};

const getFunctionClassificationsCached: typeof getFunctionClassificationsRemote =
  async (targets, _centroids, model, completionSystemPrompt) => {
    const centroids = [..._centroids];
    centroids.sort();
    const centroidJoined = centroids.join();
    const responses: ResponseFunction[] = targets.map((src, index) => {
      const target = getEscapedCell(src);
      const path = "./cache/" + model + "/" + getHash(target + centroidJoined);
      const cached = existsSync(path);
      return { src, target, path, cached, index, classification: "" };
    });
    const { local, remote } = responses.reduce(
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
      } as RequestGroupFunction
    );

    if (local.length) {
      for (const request of local) {
        const classification = readFileSync(request.path, {
          encoding: "utf-8",
        });
        responses[request.index].classification = classification;
      }
    }

    if (remote.length) {
      const remoteResponses = await getFunctionClassificationsRemote(
        remote.map((r) => r.target),
        centroids,
        model,
        completionSystemPrompt
      );
      for (let i = 0; i < remote.length; i++) {
        responses[remote[i].index].classification = remoteResponses[i];
        if (remoteResponses[i]) {
          writeFileSync(remote[i].path, remoteResponses[i], {
            encoding: "utf-8",
          });
        }
      }
    }

    responses.sort((a, z) => a.index - z.index);
    return responses.map((r) => r.classification);
  };

export const getFunctionClassifications: typeof getFunctionClassificationsRemote =
  async (targets, centroids, model, completionSystemPrompt) => {
    const chunkSize = 300;
    const centroidSize = centroids.join("").length;

    const res: string[] = [];
    let chunk: string[] = [];

    if (centroidSize > chunkSize) {
      throw new Error("centroids dont fit into the context window");
    }

    for (let i = 0; i < targets.length; i++) {
      chunk.push(targets[i]);
      const chars = chunk.join().length + centroidSize;
      if (i === targets.length - 1 || chars >= chunkSize) {
        const nextClassifications = await getFunctionClassificationsCached(
          chunk,
          centroids,
          model,
          completionSystemPrompt
        );
        res.push(...nextClassifications);
        chunk = [];
      }
    }

    return res;
  };
