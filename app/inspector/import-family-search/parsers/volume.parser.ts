import {
  testItem,
  Parser,
  POSTFIX,
  DELIMITER,
} from "@/app/inspector/import-family-search/parsers/utils";

const singleRegexp = new RegExp(
  `^Vol\\w{0,3}\\s*(\\d+${POSTFIX})${DELIMITER}(\\d+${POSTFIX})${DELIMITER}(\\d+${POSTFIX})`,
  "i"
);
const rangeRegexp = new RegExp(
  `^Vol\\w{0,3}\\s*(\\d+${POSTFIX})${DELIMITER}(\\d+${POSTFIX})${DELIMITER}(\\d+${POSTFIX})${DELIMITER}(\\d+${POSTFIX})`,
  "i"
);

const volumeParser: Parser = {
  example: "Volume 1-2/3-5; Vol 10-20/30",
  test: (item) => testItem(/^Vol/, item),
  parse: (item) => {
    const toProcess: string[] = [];
    const multi = testItem(/;/, item);
    if (multi && !item.dgs.includes("_")) {
      toProcess.push(...multi.split(";").map((s) => s.trim()));
    } else {
      toProcess.push(
        testItem(singleRegexp, item) || testItem(rangeRegexp, item)
      );
    }

    const results: string[][] = [];
    for (const part of toProcess) {
      const clean = part.replace(/\s?\(cont\.\)?\s?/i, " ").replace(/\s?-\s?/g, "-").trim();
      if (rangeRegexp.test(clean)) {
        const match = clean.match(rangeRegexp);
        if (!match) return [];
        const [_, f, d, cStart, cEnd] = match;
        if (cEnd) {
          const startNum = parseInt(cStart.replace(/\D/g, ""), 10);
          const endNum = parseInt(cEnd.replace(/\D/g, ""), 10);
          results.push([f, d, cStart]);
          for (let i = startNum + 1; i < endNum; i++) {
            results.push([f, d, i.toString()]);
          }
          results.push([f, d, cEnd]);
        } else {
          results.push([f, d, cStart]);
        }
      } else if (singleRegexp.test(clean)) {
        const match = clean.match(singleRegexp);
        if (!match) return [];
        const [_, f, d, c] = match;
        results.push([f, d, c]);
      }
    }

    return results;
  },
};

export default volumeParser;
