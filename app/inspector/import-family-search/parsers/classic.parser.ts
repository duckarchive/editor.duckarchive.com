import {
  testItem,
  Parser,
  POSTFIX,
  DELIMITER,
} from "@/app/inspector/import-family-search/parsers/utils";

const DESCRIPTION = "о|o|оп|on|оn|oп";
const CASES = "д|дел|c|спр|сп|cnp|cn|c|ekh|ex|ех";

const singleRegexp = new RegExp(
  `^ф\\.\\s*(\\d+${POSTFIX})${DELIMITER}+(${DESCRIPTION})\\.?${DELIMITER}+(\\d+${POSTFIX})${DELIMITER}+(${CASES})\\.?${DELIMITER}*(\\d+[–—―-]*${POSTFIX})`,
  "i"
);
const rangeRegexp = new RegExp(
  `^ф\\.\\s*(\\d+${POSTFIX})${DELIMITER}+(${DESCRIPTION})\\.?${DELIMITER}+(\\d+${POSTFIX})${DELIMITER}+(${CASES})\\.?${DELIMITER}*(\\d+[–—―-]*${POSTFIX})${DELIMITER}+(\\d+[–—―-]*${POSTFIX})`,
  "i"
);

const classicParser: Parser = {
  example: "Ф. 2, о. 9, д. 120-123",
  test: (item) =>
    testItem(new RegExp(`^ф\\.?.+(${DESCRIPTION})\\.?.+(${CASES})`, "i"), item),
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
      const clean = part.replace(/\s?-\s?/g, "-").trim();
      if (rangeRegexp.test(clean)) {
        const match = clean.match(rangeRegexp);
        if (!match) return [];
        const [_, f, __, d, ___, cStart, cEnd] = match;
        if (cEnd) {
          const startNum = parseInt(cStart.replace(/\D/g, ""), 10);
          const endNum = parseInt(cEnd.replace(/\D/g, ""), 10);
          if (endNum <= startNum) {
            // it means it's not a range, it's a volume of same case
            results.push([f, d, cStart]);
            // results.push([f, d, `${cStart}Т${cEnd}`]);
            continue;
          }
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
        const [_, f, __, d, ___, c] = match;
        results.push([f, d, c]);
      }
    }

    return results;
  },
};

export default classicParser;
