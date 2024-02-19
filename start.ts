import { unifySemanticSchema } from "./src";
import { Operation } from "./src/types";
import { getEscapedCell } from "./src/utils";

const classificationsCoarse = [
  "home expenses, household bills",
  "retail, grocery, dining, food, online shopping, cafe",
  "contribution, investment, retirement saving, transfer, income, reimbursement, bonus, autopay, interest",
  "fuel, transportation, vehicle, auto insurance",
  "healthcare, medical expense, wellness",
  "travel expense, accommodation, holiday expense, recreational activity",
  "zelle",
];

const classificationsFine = classificationsCoarse.flatMap(coarse => coarse.split(",")).map(c => c.trim())

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
      centroids: ["date", "description", "debit amount qty $"],
    },
  },
  {
    src: "./out/2.csv",
    target: "./out/3.csv",
    name: "reduce",
    arg: {
      initialAccumulator: [],
      fn: (acc, row, i, table) => {
        if (i === 0) {
          acc.push([...row]);
        } else {
          const next = [...row];
          const dateI = table[0].indexOf("date");
          next[dateI] = cleanDate(next[dateI]);
          acc.push(next);
        }
        return acc;
      },
    },
  },
  {
    src: "./out/3.csv",
    target: "./out/4.csv",
    name: "classify",
    arg: {
      srcColumn: "description",
      targetColumn: "category fine",
      model: "text-embedding-3-small",
      classifications: classificationsFine,
    },
  },
  {
    src: "./out/4.csv",
    target: "./out/5.csv",
    name: "reduce",
    arg: {
      initialAccumulator: [],
      fn: (acc, row, i, table) => {
        if (i === 0) {
          acc.push([...row, `"category coarse"`]);
        } else {
          const srcI = table[0].indexOf(`"category fine"`);
          const fineCat = row[srcI];
          const coarseCat =
            classificationsCoarse.find((c) => c.includes(getEscapedCell(fineCat))) ?? "";
          acc.push([...row, `"${coarseCat}"`]);
        }
        return acc;
      },
    },
  },
  {
    src: "./out/5.csv",
    target: "./out/6.csv",
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
    src: "./out/6.csv",
    target: "./out/7.csv",
    name: "reduce",
    arg: {
      initialAccumulator: [
        ["category", "total", "count", "avg"],
        ...classificationsCoarse.map((c) => [c, 0, 0, 0]),
      ],
      fn: (acc, row, i, table) => {
        const category = row[table[0].indexOf(`"category coarse"`)];
        const confidence = row[table[0].indexOf(`"debit amount qty $"`)];
        if (i > 0) {
          const j = classificationsCoarse.indexOf(category.replace(/"/g, "")) + 1;
          (acc[j][1] as number) += +confidence;
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
