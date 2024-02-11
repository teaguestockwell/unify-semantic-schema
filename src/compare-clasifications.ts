import { getCosineSimilarity } from "./get-cosign-similarity";
import { getEmbeddings } from "./get-embeddings";
import { getFunctionClassifications } from "./get-function-classification";
import { Embedding } from "./types";

// const centroids = [
//   "home expenses, household bills",
//   "retail, grocery, dining, food, online shopping, cafe",
//   "contribution, investment, retirement saving, transfer, income, reimbursement, bonus, autopay",
//   "fuel, transportation, vehicle, auto insurance",
//   "healthcare, medical expense, wellness",
//   "travel expense, accommodation, holiday expense, recreational activity",
//   "zelle",
// ];

const centroids = [
  "rent / utils",
  "food",
  "car",
  "travel",
  "business",
  "hobby / fun",
  "invest / transfer",
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
[
  {
    target: "arby s 6409",
    large: "0.2733 food",
    small: "0.2916 car",
  },
  {
    target: "love's #448",
    large: "0.2546 travel",
    small: "0.2698 travel",
  },
  {
    target: "el maestro del taco",
    large: "0.2469 food",
    small: "0.2219 car",
  },
  {
    target: "76 - united pacific 54",
    large: "0.1715 travel",
    small: "0.2117 travel",
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

// function calling works much better in this test as it appears to understand proper nouns
[
  {
    target: "arby s 6409",
    "gpt-3.5-turbo-0125":
      "retail, grocery, dining, food, online shopping, cafe",
    "gpt-4-0125-preview":
      "retail, grocery, dining, food, online shopping, cafe",
  },
  {
    target: "love's #448",
    "gpt-3.5-turbo-0125": "fuel, transportation, vehicle, auto insurance",
    "gpt-4-0125-preview": "fuel, transportation, vehicle, auto insurance",
  },
  {
    target: "el maestro del taco",
    "gpt-3.5-turbo-0125":
      "retail, grocery, dining, food, online shopping, cafe",
    "gpt-4-0125-preview":
      "retail, grocery, dining, food, online shopping, cafe",
  },
  {
    target: "76 - united pacific 54",
    "gpt-3.5-turbo-0125": "fuel, transportation, vehicle, auto insurance",
    "gpt-4-0125-preview": "fuel, transportation, vehicle, auto insurance",
  },
];
[
  {
    target: "arby s 6409",
    "gpt-3.5-turbo-0125": "food",
    "gpt-4-0125-preview": "food",
  },
  {
    target: "love's #448",
    "gpt-3.5-turbo-0125": "car",
    "gpt-4-0125-preview": "car",
  },
  {
    target: "el maestro del taco",
    "gpt-3.5-turbo-0125": "food",
    "gpt-4-0125-preview": "food",
  },
  {
    target: "76 - united pacific 54",
    "gpt-3.5-turbo-0125": "car",
    "gpt-4-0125-preview": "car",
  },
];
const runFunctionClassifications = async () => {
  const models = ["gpt-3.5-turbo-0125"] as const;
  const out: any[] = [...targets].map((target) => ({ target }));
  for (const model of models) {
    const classifications = await getFunctionClassifications(
      targets,
      centroids,
      model
    );
    for (let i = 0; i < targets.length; i++) {
      out[i][model] = classifications[i];
    }
  }
  console.log(JSON.stringify(out, null, 2));
};

// getClusters();
runFunctionClassifications();
