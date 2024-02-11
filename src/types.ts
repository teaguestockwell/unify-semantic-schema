import type { getEmbeddings } from "./get-embeddings";
import type { getFunctionClassifications } from "./get-function-classification";

export type GetEmbeddings = typeof getEmbeddings;

export type GetFunctionClassifications = typeof getFunctionClassifications;

export type OpenAIEmbedding = {
  object: "embedding";
  embedding: number[];
  index: number;
};

export type Embedding = {
  columnName: string;
  target: string;
  embedding: number[];
};

export type Comparator<T = string> = {
  centroid: T;
  comparator: (a: string, z: string) => number;
};

export type Comparators<T = string> = Array<Comparator<T>>;

export type Transformer = (s: string) => string;

export type Transformers<T extends string | number | symbol = string> = Partial<
  Record<T, Transformer>
>;

export type CentroidCoalesceMap = {
  [centroid: string]: string[];
};

export type Classifier<T extends string> = {
  centroids: string[];
  targetColumnName: string;
  srcColumnName: T;
};

export type Classifiers<T extends string> = Array<Classifier<T>>;

export type Reducer<Accumulator> = {
  name: string;
  initialAccumulator: Accumulator;
  fn: (
    accumulator: Accumulator,
    row: string[],
    index: number,
    table: string[][]
  ) => Accumulator;
};
