export const sampleCoalesceMap = {
  // account: ["file name"],
  date: [
    "date",
    "transaction date",
    "run date",
    "posting date",
    "time",
    "reference",
  ],
  retailer: [
    "original description",
    "description",
    "transaction description",
    "investment",
    "plan",
    "asset",
    "action"
  ],
  credit: ["credit"],
  debit: ["debit", "amount", "amount ($)", "transaction amount"],
};

export const sampleTxMap = {
  date: (s: string) => {
    try {
      const d = new Date(s);
      const yyyy = d.getFullYear();
      const mm =
        ((d.getMonth() + 1) + "").length == 1
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

export const sampleComparators = [
  {
    coalescedColumnName: "date",
    comparator: (a: string, z: string) => {
      return a.localeCompare(z);
    },
  },
];
