import { getEnv } from "./get-env";

export const getClassificationFunctionDef = (centroids: string[]) => {
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

const exampleChatCompletionWithFunctionCall = {
  id: "chatcmpl-8qzwbZzH3Lgk7nEOA8vDSd9eu4h7E",
  object: "chat.completion",
  created: 1707641861,
  model: "gpt-3.5-turbo-0125",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_qi7ZR5zNNoxD7QEF6utYFjBg",
            type: "function",
            function: {
              name: "classify",
              arguments:
                '{"id": 0, "classification": "retail, grocery, dining, food, online shopping, cafe"}',
            },
          },
          {
            id: "call_23qBiWQjrbmCbmqLJBm9oc1A",
            type: "function",
            function: {
              name: "classify",
              arguments:
                '{"id": 1, "classification": "fuel, transportation, vehicle, auto insurance"}',
            },
          },
          {
            id: "call_Oo2D7KmDPQCOqrPFTxc1HuEF",
            type: "function",
            function: {
              name: "classify",
              arguments:
                '{"id": 2, "classification": "retail, grocery, dining, food, online shopping, cafe"}',
            },
          },
          {
            id: "call_wtlDY98egsQqjt5mtjFG1pXn",
            type: "function",
            function: {
              name: "classify",
              arguments:
                '{"id": 3, "classification": "fuel, transportation, vehicle, auto insurance"}',
            },
          },
        ],
      },
      logprobs: null,
      finish_reason: "tool_calls",
    },
  ],
  usage: {
    prompt_tokens: 186,
    completion_tokens: 125,
    total_tokens: 311,
  },
  system_fingerprint: "fp_69829325d0",
};
// https://openai.com/pricing#language-models
type Model = "gpt-3.5-turbo-0125" | "gpt-4-0125-preview";
type ChatCompletionRes = typeof exampleChatCompletionWithFunctionCall;

export const getFunctionClassifications = async (
  targets: string[],
  centroids: string[],
  model: Model
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
            "classify user targets by calling the classify function. do not provide content in your response.",
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

  const json: ChatCompletionRes = await res.json();
  console.log(JSON.stringify(json, null, 2));
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
          throw new Error(
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
