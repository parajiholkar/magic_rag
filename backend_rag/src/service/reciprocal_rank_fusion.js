
export function reciprocalRankFusion(rankings, k = 60) {
  const scores = {};
  const docMap = new Map();

  for (const ranking of rankings) {
    ranking.forEach((Document, rank) => {
      scores[Document.id] = (scores[Document.id] || 0) + 1 / (k + rank + 1);

      if(!docMap.has(Document.id)){
        docMap.set(Document.id, Document);
      }

    });
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({
      ...docMap.get(id),
      rrfScore: score
    }));
}

