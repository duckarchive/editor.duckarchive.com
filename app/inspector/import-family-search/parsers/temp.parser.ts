import {
  testItem,
  Parser,
  POSTFIX,
  DELIMITER,
} from "@/app/inspector/import-family-search/parsers/utils";

const DESCRIPTION = "о|o|оп|on|оn|oп";
const CASES = "д|дел|c|спр|сп|cnp|cn|c|ekh|ex|ех";

const singleRegexp = new RegExp(
  `^ф${DELIMITER}+95801${DELIMITER}+(${CASES})\\.?${DELIMITER}*(\\d+[–—―-]*${POSTFIX})`,
  "i"
);

const tempParser: Parser = {
  example: "dev purposes only",
  test: (item) =>
    testItem(new RegExp(`^ф\\.`, "i"), item),
  parse: (item) => {
    const toProcess: string[] = [];
    const multi = testItem(/;/, item);
    if (multi && !item.dgs.includes("_")) {
      toProcess.push(...multi.split(";").map((s) => s.trim()));
    } else {
      toProcess.push(
        testItem(singleRegexp, item)
      );
    }

    const results: string[][] = [];
    for (const part of toProcess) {
      const clean = part.replace(/\s?-\s?/g, "-").trim();
      if (singleRegexp.test(clean)) {
        const match = clean.match(singleRegexp);
        if (!match) return [];
        const [_, ___, c] = match;
        results.push(["958", "1", c]);
      }
    }

    return results;
  },
};

export default tempParser;
