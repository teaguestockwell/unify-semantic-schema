import { readdir } from "fs/promises"

export const getFileNames = async (dir: string) => {
  return readdir(dir, "utf-8")
}