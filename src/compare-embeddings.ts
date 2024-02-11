import { getCosineSimilarity } from "./get-cosign-similarity";
import { getEmbeddings } from "./get-embeddings";
import { Embedding } from "./types";

const centroids = [
  "home expenses, household bills",
  "retail, grocery, dining, food, online shopping, cafe",
  "contribution, investment, retirement saving, transfer, income, reimbursement, bonus, autopay",
  "fuel, transportation, vehicle, auto insurance",
  "healthcare, medical expense, wellness",
  "travel expense, accommodation, holiday expense, recreational activity",
  "zelle",
];

const targets = [
  "arby s 6409",
  "love's #448",
  "el maestro del taco",
  "76 - united pacific 54",
];

// neither embedding model is properly classifying
// it appears to be due to a limited understanding of proper nouns
[
  {
    target: "arby s 6409",
    large: "0.2630 retail, grocery, dining, food, online shopping, cafe",
    small:
      "0.1712 contribution, investment, retirement saving, transfer, income, reimbursement, bonus, autopay",
  },
  {
    target: "love's #448",
    large: "0.1867 zelle",
    small: "0.1779 zelle",
  },
  {
    target: "el maestro del taco",
    large: "0.1778 zelle",
    small: "0.1000 retail, grocery, dining, food, online shopping, cafe",
  },
  {
    target: "76 - united pacific 54",
    large: "0.1505 zelle",
    small:
      "0.1746 contribution, investment, retirement saving, transfer, income, reimbursement, bonus, autopay",
  },
];

const getClusters = async () => {
  const centroidsSmall: Embedding[] = [];
  const centroidsLarge: Embedding[] = [];
  const targetsSmall: Embedding[] = [];
  const targetsLarge: Embedding[] = [];
  const all: any[] = [];

  for (const centroid of centroids) {
    const embeddingsSmall = await getEmbeddings(
      [centroid],
      "text-embedding-3-small"
    );
    const embeddingsLarge = await getEmbeddings(
      [centroid],
      "text-embedding-3-large"
    );
    centroidsSmall.push(embeddingsSmall[0]);
    centroidsLarge.push(embeddingsLarge[0]);
  }
  for (const target of targets) {
    const embeddingsSmall = await getEmbeddings(
      [target],
      "text-embedding-3-small"
    );
    const embeddingsLarge = await getEmbeddings(
      [target],
      "text-embedding-3-large"
    );
    targetsSmall.push(embeddingsSmall[0]);
    targetsLarge.push(embeddingsLarge[0]);
  }

  for (let i = 0; i < targets.length; i++) {
    let maxSmallName = "";
    let maxLargeName = "";
    let maxSmallSimilarity = -1;
    let maxLargeSimilarity = -1;
    for (let j = 0; j < centroids.length; j++) {
      const small = getCosineSimilarity(
        targetsSmall[i].embedding,
        centroidsSmall[j].embedding
      );
      const large = getCosineSimilarity(
        targetsLarge[i].embedding,
        centroidsLarge[j].embedding
      );
      if (small > maxSmallSimilarity) {
        maxSmallSimilarity = small;
        maxSmallName = centroids[j];
      }
      if (large > maxLargeSimilarity) {
        maxLargeSimilarity = large;
        maxLargeName = centroids[j];
      }
    }
    all.push({
      target: targets[i],
      large: maxLargeSimilarity.toFixed(4) + " " + maxLargeName,
      small: maxSmallSimilarity.toFixed(4) + " " + maxSmallName,
    });
  }

  console.log(JSON.stringify(all, null, 2));
};

getClusters();
