export function chunkText(input: string, size = 1000, overlap = 150) {
  const chunks: string[] = [];
  let i = 0;
  while (i < input.length) {
    const end = Math.min(i + size, input.length);
    chunks.push(input.slice(i, end));
    i += size - overlap;
  }
  return chunks;
}