import "server-only";

const MEILI_HOST = process.env.LEXGABON_MEILISEARCH_HOST;
const MEILI_KEY = process.env.LEXGABON_MEILISEARCH_API_KEY;
const MEILI_INDEX = "articles";

export type LexGabonStats = {
  indexedArticlesCount: number;
  officialSourcesCount: number;
};

export async function getLexGabonStats(): Promise<LexGabonStats> {
  const fallback: LexGabonStats = { indexedArticlesCount: 3032, officialSourcesCount: 5 };

  if (!MEILI_HOST || !MEILI_KEY) return fallback;

  try {
    const res = await fetch(`${MEILI_HOST}/indexes/${MEILI_INDEX}/stats`, {
      headers: { Authorization: `Bearer ${MEILI_KEY}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    return {
      indexedArticlesCount: data.numberOfDocuments ?? fallback.indexedArticlesCount,
      officialSourcesCount: fallback.officialSourcesCount,
    };
  } catch {
    return fallback;
  }
}
