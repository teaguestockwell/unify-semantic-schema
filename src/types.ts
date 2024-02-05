export type OpenAIEmbedding = {
  object: "embedding";
  embedding: number[];
  index: number;
};

export type Embedding = {
  columnName: string;
  target: string;
  embedding: number[];
}