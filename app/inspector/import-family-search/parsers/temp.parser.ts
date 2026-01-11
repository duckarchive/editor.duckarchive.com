import {
  testItem,
  Parser,
  POSTFIX,
  DELIMITER,
} from "@/app/inspector/import-family-search/parsers/utils";

const DESCRIPTION = "о|o|оп|on|оn|oп";
const CASES = "д|дел|c|спр|сп|cnp|cn|c|ekh|ex|ех";

const singleRegexp = new RegExp(
  `^\\s*(\\d+)`,
  "i"
);

const tempParser: Parser = {
  example: "dev purposes only",
  test: (item) =>
    testItem(new RegExp(`^\\d+`, "i"), item),
  parse: (item) => {
    const toProcess: string[] = [];
    const multi = testItem(/\./, item);
    if (multi && !item.dgs.includes("_")) {
      toProcess.push(...multi.split(".").map((s) => s.trim()));
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
        const [_, c] = match;
        results.push(["БІБЛ", "1", c]);
      }
    }

    return results;
  },
};

export default tempParser;
