export const getDotProduct = (a: number[], b: number[]) => {
  return a.map((e, i) => e * b[i]).reduce((acc, cur) => acc + cur, 0);
};

export const getMagnitude = (a: number[]) => {
  return Math.sqrt(a.reduce((acc, cur) => acc + Math.pow(cur, 2), 0));
};

export const getCosineSimilarity = (a: number[], b: number[]) => {
  if (a.length !== b.length) {
    throw new Error("cant find similarity between embeddings represented by a different number of dimensions");
  }
  return getDotProduct(a, b) / (getMagnitude(a) * getMagnitude(b));
};
