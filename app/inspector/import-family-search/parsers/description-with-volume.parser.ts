import {
  testItem,
  Parser,
  DELIMITER,
} from "@/app/inspector/import-family-search/parsers/utils";

const singleRegexp = new RegExp(
  `^(\\d+)${DELIMITER}*(\\d+)${DELIMITER}*т${DELIMITER}*(\\d+)$`,
  "i"
);

const descriptionWithVolumeParser: Parser = {
  example: "5142- 3 т.2",
  test: (item) =>
    testItem(singleRegexp, item),
  parse: (item) => {
    const toProcess: string[] = [];
    toProcess.push(
      testItem(singleRegexp, item)
    );

    const results: string[][] = [];
    for (const part of toProcess) {
      const clean = part.replace(/\s?-\s?/g, "-").trim();
      if (singleRegexp.test(clean)) {
        const match = clean.match(singleRegexp);
        if (!match) return [];
        const [_, f, d, v] = match;
        results.push([f, `${d}Т${v}`]);
      }
    }

    return results;
  },
};

export default descriptionWithVolumeParser;
