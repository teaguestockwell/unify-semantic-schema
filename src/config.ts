import { Operation } from "./types";

const centroids = [
  "home expenses, household bills",
  "retail, grocery, dining, food, online shopping, cafe",
  "contribution, investment, retirement saving, transfer, income, reimbursement, bonus, autopay",
  "fuel, transportation, vehicle, auto insurance",
  "healthcare, medical expense, wellness",
  "travel expense, accommodation, holiday expense, recreational activity",
  "zelle",
];

export const operations: Operation<string>[] = [
  {
    src: "./data/",
    target: "./out/1.csv",
    name: "union",
    arg: {},
  },
  {
    src: "./out/1.csv",
    target: "./out/2.csv",
    name: "coalesce",
    arg: {
      model: "text-embedding-3-large",
      centroids: ["date", "description", "debit amount qty $"],
    },
  },
  {
    src: "./out/2.csv",
    target: "./out/3.csv",
    name: "classify",
    arg: {
      srcColumnName: "description",
      targetColumnName: "category",
      model: "text-embedding-3-small",
      centroids,
    },
  },
  {
    src: "./out/3.csv",
    target: "./out/4.csv",
    name: "transform",
    arg: {
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
    },
  },
  {
    src: "./out/4.csv",
    target: "./out/5.csv",
    name: "sort",
    arg: [
      {
        centroid: "date",
        comparator: (a, z) => {
          return a.localeCompare(z);
        },
      },
    ],
  },
  {
    src: "./out/5.csv",
    target: "./out/6.csv",
    name: "summarize",
    arg: {
      initialAccumulator: [
        ["category", "total", "count", "avg"],
        ...centroids.map((c) => [c, 0, 0, 0]),
      ],
      fn: (acc, row, i, table) => {
        const category = row[table[0].indexOf(`"category"`)];
        const confidence = row[table[0].indexOf(`"category confidence"`)];
        if (i > 0) {
          const j = centroids.indexOf(category.replace(/"/g, "")) + 1;
          (acc[j][1] as number) += +confidence;
          (acc[j][2] as number)++;
          (acc[j][3] as number) = (acc[j][1] as number) / (acc[j][2] as number);
        }
        return acc;
      },
    },
  },
];
