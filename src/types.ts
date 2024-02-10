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

export type Classifier = {
  centroids: string[];
  targetColumnName: string;
  minSimilarity?: number;
};

export type Classifiers = Array<Classifier>;
