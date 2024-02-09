import { Comparators, Transformers } from "./types";

/**
 * the semantic, desirable column names used to unify the schema
 *
 * each table's columns will be clustered with on of the centroids
 * then each cluster will be sorted by semantic similarity to the centroid
 * input column names will be coalesced in order or most to least similar to the centroid
 */
export const centroids = ["date", "description", "amount $"] as const;
type Centroid = (typeof centroids)[number];

/**
 * before sorting with comparators, a centroid needs to be normalized so it can be sorted
 *
 * transformers are run on every cell of with the same name from the coalesced table
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
 * finally sort the table
 */
export const comparators: Comparators<Centroid> = [
  {
    coalescedColumnName: "date",
    comparator: (a: string, z: string) => {
      return a.localeCompare(z);
    },
  },
];
