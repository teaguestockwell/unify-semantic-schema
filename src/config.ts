import { Classifiers, Comparators, Reducer, Transformers } from "./types";

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
      "home expenses, household bills",
      "retail, grocery, dining, food, online shopping, cafe",
      "contribution, investment, retirement saving, transfer, income, reimbursement, bonus, autopay",
      "fuel, transportation, vehicle, auto insurance",
      "healthcare, medical expense, wellness",
      "travel expense, accommodation, holiday expense, recreational activity",
      "zelle",
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
      const d = new Date(s.replace(/"/g, ""));
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

export const reducers = [
  {
    name: "category confidence",
    fn: (acc, row, i, table) => {
      if (i === 0) {
        return acc;
      }
      const confidence =
        row[table[0].indexOf(`${classifiers[0].targetColumnName} confidence`)];
      const category = row[table[0].indexOf(classifiers[0].targetColumnName)];
      if (!confidence || !category) {
        return acc;
      }
      acc[category].acc = +(+confidence + acc[category].acc).toFixed(4);
      acc[category].num++;
      acc[category].avg = +(acc[category].acc / acc[category].num).toFixed(4);

      if (i !== table.length - 1) {
        return acc;
      } else {
        let sb = ``;
        for (const cat of classifiers[0].centroids) {
          const stats = acc[cat];
          sb +=
            cat +
            " " +
            JSON.stringify(stats)
              .replace(/"/g, "")
              .replace(/,/g, " ")
              .replace("{", "")
              .replace("}", "") +
            " ";
        }
        sb += ``;
        return sb as any;
      }
    },
    initialAccumulator: classifiers[0].centroids.reduce((acc, cur) => {
      (acc as any)[cur] = { num: 0, acc: 0, avg: 0 };
      return acc;
    }, {}),
  } satisfies Reducer<{
    [classifier: string]: { num: number; acc: number; avg: number };
  }>,
  {
    name: "category total",
    fn: (acc, row, i, table) => {
      if (i === 0) {
        return acc;
      }
      const amount = row[table[0].indexOf(centroids[2])];
      const category = row[table[0].indexOf(classifiers[0].targetColumnName)];
      if (!amount || !category) {
        return acc;
      }
      acc[category].acc = +(+amount + acc[category].acc).toFixed(4);
      acc[category].num++;
      acc[category].avg = +(acc[category].acc / acc[category].num).toFixed(4);

      if (i !== table.length - 1) {
        return acc;
      } else {
        let sb = ``;
        for (const cat of classifiers[0].centroids) {
          const stats = acc[cat];
          sb +=
            cat +
            " " +
            JSON.stringify(stats)
              .replace(/"/g, "")
              .replace(/,/g, " ")
              .replace("{", "")
              .replace("}", "") +
            " ";
        }
        sb += ``;
        return sb as any;
      }
    },
    initialAccumulator: classifiers[0].centroids.reduce((acc, cur) => {
      (acc as any)[cur] = { num: 0, acc: 0, avg: 0 };
      return acc;
    }, {}),
  } satisfies Reducer<{
    [classifier: string]: { num: number; acc: number; avg: number };
  }>,
];
