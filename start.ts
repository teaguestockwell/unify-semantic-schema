import { unifySemanticSchema } from "./src";
import { Operation } from "./src/types";
import { getEscapedCell } from "./src/utils";
import * as config from "./data/config"

const categories: Record<string, string[]> = config.categories;
const categoryLookup = Object.entries(categories).reduce((acc, [k, values]) => {
  values.forEach((e) => (acc[e] = k));
  return acc;
}, {} as Record<string, string>);

const cleanDate = (s: string) => {
  const d = new Date(s.replace(/"/g, ""));
  const yyyy = d.getFullYear();
  const mm =
    (d.getMonth() + 1 + "").length == 1
      ? "0" + (d.getMonth() + 1)
      : d.getMonth() + 1;
  const dd = (d.getDate() + "").length === 1 ? "0" + d.getDate() : d.getDate();
  return yyyy + "-" + mm + "-" + dd;
};

const operations: Operation[] = [
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
      centroids: ["date", "debit amount qty $", "description"],
    },
  },
  {
    src: "./out/2.csv",
    target: "./out/3.csv",
    name: "classify",
    arg: {
      srcColumn: "description",
      targetColumn: "category",
      model: "text-embedding-3-large",
      classifications: Object.values(categories).flatMap((c) => c) as string[],
    },
  },
  {
    src: "./out/3.csv",
    target: "./out/4.csv",
    name: "reduce",
    arg: {
      initialAccumulator: [],
      fn: (acc, row, i, table) => {
        const next = [...row];
        if (i === 0) {
          const amountI = table[0].indexOf("debit amount qty $");
          next[amountI] = "amount";
        } else {
          const dateI = table[0].indexOf("date");
          const catI = table[0].indexOf("category");
          const amountI = table[0].indexOf("debit amount qty $");
          next[dateI] = cleanDate(next[dateI]);
          const nextCat = categoryLookup[next[catI]];
          next[catI] = nextCat;
          const _nextAmount = Number(getEscapedCell(next[amountI]));
          next[amountI] = (() => {
            const abs = Math.abs(_nextAmount);
            if (nextCat === "transfer") {
              return _nextAmount;
            }
            return -abs
          })().toFixed(2)
        }
        acc.push(next);
        return acc;
      },
    },
  },
  {
    src: "./out/4.csv",
    target: "./out/5.csv",
    name: "sort",
    arg: [
      {
        column: "date",
        comparator: (a, z) => {
          return a.localeCompare(z);
        },
      },
    ],
  },
  {
    src: "./out/5.csv",
    target: "./out/category-amounts.csv",
    name: "reduce",
    arg: {
      initialAccumulator: [
        ["category", "total", "count", "avg"],
        ...Object.keys(categories).map((c) => [c, 0, 0, 0]),
      ],
      fn: (acc, row, i, table) => {
        const target = row[table[0].indexOf("category")];
        const quantifier = row[table[0].indexOf("amount")];
        if (i > 0) {
          const j =
            Object.keys(categories).indexOf(target.replace(/"/g, "")) + 1;
          (acc[j][1] as number) += +quantifier;
          (acc[j][2] as number)++;
          (acc[j][3] as number) = (acc[j][1] as number) / (acc[j][2] as number);
        }
        return acc;
      },
    },
  },
  {
    src: "./out/5.csv",
    target: "./out/category-confidence.csv",
    name: "reduce",
    arg: {
      initialAccumulator: [
        ["category", "total", "count", "avg"],
        ...Object.keys(categories).map((c) => [c, 0, 0, 0]),
      ],
      fn: (acc, row, i, table) => {
        const target = row[table[0].indexOf("category")];
        const quantifier = row[table[0].indexOf("category confidence")];
        if (i > 0) {
          const j =
            Object.keys(categories).indexOf(target.replace(/"/g, "")) + 1;
          (acc[j][1] as number) += +quantifier;
          (acc[j][2] as number)++;
          (acc[j][3] as number) = (acc[j][1] as number) / (acc[j][2] as number);
        }
        return acc;
      },
    },
  },
];

unifySemanticSchema(operations)
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
