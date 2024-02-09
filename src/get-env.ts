import { readFileSync } from "fs";
import { resolve } from "path";

export const getEnv = () => {
  const env = readFileSync(resolve(__dirname, "..", ".env"), "utf-8")
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
