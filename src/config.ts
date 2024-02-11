import { Classifiers, Comparators, Transformers } from "./types";

/**
 * the semantic, desirable column names used to unify the schema
 * each table's columns will be placed into a group (cluster) of one centroid
 * each cluster will be sorted by semantic similarity to the centroid
 * each cluster will be used to coalesce the output table by looking for the most to least similar actual column name
 */
export const centroids = ["date", "description", "debit amount qty $"] as const;
type Centroid = (typeof centroids)[number];

/**
 * note these will write over columns of the same name
 */
export const classifiers: Classifiers<Centroid> = [
  {
    centroids: [
      "zelle",
      "food",
      "shopping",
      "transportation",
      "insurance",
      "laundry",
      "investment",
      "transfer",
      "payment",
    ],
    srcColumnName: "description",
    targetColumnName: "category",
  },
];

/**
 * transformers are applied to normalize each cell in the coalesced table with the same name
 * the 'date' transformer standardizes date strings so they can be sorted
 */
export const transformers: Transformers<Centroid> = {
  date: (s: string) => {
    try {
      const d = new Date(s);
      const yyyy = d.getFullYear();
      const mm =
        (d.getMonth() + 1 + "").length == 1
          ? "0" + (d.getMonth() + 1)
          : d.getMonth() + 1;
      const dd =
        (d.getDate() + "").length === 1 ? "0" + d.getDate() : d.getDate();
      return yyyy + "-" + mm + "-" + dd;
    } catch (e) {
      return s;
    }
  },
};

/**
 * finally sort the table by applying each comparator first to last
 */
export const comparators: Comparators<Centroid> = [
  {
    centroid: "date",
    comparator: (a: string, z: string) => {
      return a.localeCompare(z);
    },
  },
];
