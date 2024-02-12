import { writeFileSync } from "fs";
import { getEmbeddings } from "../src/get-embeddings";
import { getFunctionClassifications } from "../src/get-function-classifications";
import { CompletionModel, Embedding } from "../src/types";
import { getCosineSimilarity } from "../src/utils";

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

const embeddingClassification = async () => {
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
  writeFileSync(
    "./playground/embedding-classification.json",
    JSON.stringify(all, null, 2),
    { encoding: "utf-8" }
  );
};

const functionClassification = async () => {
  const models: CompletionModel[] = [
    "gpt-3.5-turbo-0125",
    "gpt-4-0125-preview",
  ];
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
  writeFileSync(
    "./playground/function-classification.json",
    JSON.stringify(out, null, 2),
    { encoding: "utf-8" }
  );
};

embeddingClassification();
functionClassification();
