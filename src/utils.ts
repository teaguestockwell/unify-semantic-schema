import { createHash } from "crypto";
import { readFileSync } from "fs";

export const getEscapedCell = (s: string) => {
  if (s[0] === `"` && s[s.length - 1] === `"`) {
    return s.substring(1, s.length - 1);
  }
  return s;
};

export const getHash = (s: string) => {
  const hash = createHash("md5");
  hash.update(s);
  return hash.digest("hex");
};

export const getChunks = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
  }
  return chunks;
};

export const getDotProduct = (a: number[], b: number[]) => {
  return a.map((e, i) => e * b[i]).reduce((acc, cur) => acc + cur, 0);
};

export const getMagnitude = (a: number[]) => {
  return Math.sqrt(a.reduce((acc, cur) => acc + Math.pow(cur, 2), 0));
};

export const getCosineSimilarity = (a: number[], b: number[]) => {
  if (a.length !== b.length) {
    throw new Error(
      "cant find similarity between embeddings represented by a different number of dimensions"
    );
  }
  return getDotProduct(a, b) / (getMagnitude(a) * getMagnitude(b));
};

export const getEnv = () => {
  const env = readFileSync(".env", "utf-8")
    .split("\n")
    .reduce((acc: Record<string, string>, line: string) => {
      const [key, value] = line.split("=");
      if (key && value) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

  if (!("OPENAIKEY" in env)) {
    throw new Error("OPENAIKEY not in env");
  }

  return env as {
    OPENAIKEY: string;
  };
};
