export type DocumentMatch = {
  title: string;
  excerpt: string;
  source?: string;
};

export async function searchDocuments(_query: string): Promise<DocumentMatch[]> {
  return [];
}
