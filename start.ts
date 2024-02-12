import { unifySemanticSchema } from "./src";
import { Operation } from "./src/types";

const classifications = [
  "home expenses, household bills",
  "retail, grocery, dining, food, online shopping, cafe",
  "contribution, investment, retirement saving, transfer, income, reimbursement, bonus, autopay, interest",
  "fuel, transportation, vehicle, auto insurance",
  "healthcare, medical expense, wellness",
  "travel expense, accommodation, holiday expense, recreational activity",
  "zelle",
];

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
          acc.push([...row, `summary`]);
        } else {
          const description = row[table[0].indexOf("description")];
          const amount = row[table[0].indexOf("debit amount qty $")];
          const next = [...row, `"${description} ${amount}"`];
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
    target: "./out/3small.csv",
    name: "reduce",
    arg: {
      initialAccumulator: [],
      fn: (acc, row, i, table) => {
        if (i === table.length - 1) {
          return [table[0], ...table.slice(485, 505)];
        }
        return acc;
      },
    },
  },
  {
    src: "./out/3small.csv",
    target: "./out/4small.csv",
    name: "classify",
    arg: {
      model: "gpt-3.5-turbo-0125",
      srcColumn: "summary",
      targetColumn: "category 3.5",
      classifications: [
        "expense",
        "transfer / investment"
      ],
    },
  },
  {
    src: "./out/3.csv",
    target: "./out/4.csv",
    name: "classify",
    arg: {
      srcColumn: "description",
      targetColumn: "category",
      model: "text-embedding-3-small",
      classifications,
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
    target: "./out/6.csv",
    name: "reduce",
    arg: {
      initialAccumulator: [
        ["category", "total", "count", "avg"],
        ...classifications.map((c) => [c, 0, 0, 0]),
      ],
      fn: (acc, row, i, table) => {
        const category = row[table[0].indexOf(`"category"`)];
        const confidence = row[table[0].indexOf(`"category confidence"`)];
        if (i > 0) {
          const j = classifications.indexOf(category.replace(/"/g, "")) + 1;
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
