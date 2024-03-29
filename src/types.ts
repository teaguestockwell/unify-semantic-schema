export type EmbeddingModel =
  | "text-embedding-ada-002"
  | "text-embedding-3-small"
  | "text-embedding-3-large";

export type CompletionModel = "gpt-3.5-turbo-0125" | "gpt-4-0125-preview";

// https://openai.com/pricing#language-models
export type Model = EmbeddingModel | CompletionModel;

export type OpenAIEmbedding = {
  object: "embedding";
  embedding: number[];
  index: number;
};

export type ChatCompletion = {
  id: string;
  object: "chat.completion";
  created: number;
  model: CompletionModel;
  choices: {
    index: number;
    message: {
      role: "assistant";
      content: null;
      tool_calls: {
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }[];
    };
    logprobs: null;
    finish_reason: "tool_calls";
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint: string;
};

export type Embedding = {
  columnName: string;
  target: string;
  embedding: number[];
};

export type CentroidCoalesceMap = {
  [centroid: string]: string[];
};

export type Classifier<T extends string> = {
  classifications: string[];
  targetColumn: string;
  srcColumn: T;
  model: Model;
  completionSystemPrompt?: string
};

export type Comparator<T = string> = {
  column: T;
  comparator: (a: string, z: string) => number;
};

export type Reducer<T> = {
  initialAccumulator: T;
  fn: (accumulator: T, row: string[], index: number, table: string[][]) => T;
};

export type Comparators<T = string> = Array<Comparator<T>>;

export type Classifiers<T extends string> = Array<Classifier<T>>;

export type Coalesce = {
  model:
    | "text-embedding-ada-002"
    | "text-embedding-3-small"
    | "text-embedding-3-large";
  centroids: string[];
};

export type OperationName =
  | "classify"
  | "transform"
  | "sort"
  | "summarize"
  | "coalesce"
  | "union";

export type Operator<T extends string> =
  | {
      name: "classify";
      arg: Classifier<T>;
    }
  | {
      name: "sort";
      arg: Comparators<T>;
    }
  | {
      name: "reduce";
      arg: Reducer<unknown[][]>;
    }
  | {
      name: "coalesce";
      arg: Coalesce;
    }
  | {
      name: "union";
      arg: {};
    };

export type Operation<T extends string = string> = {
  src: string | string[];
  target: string | string[];
} & Operator<T>;
