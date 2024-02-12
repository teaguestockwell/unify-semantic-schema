import { createHash } from "crypto";

export const getHash = (s: string) => {
  const hash = createHash("md5");
  hash.update(s);
  return hash.digest("hex");
};
