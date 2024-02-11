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