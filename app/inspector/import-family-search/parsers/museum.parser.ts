import {
  testItem,
  Parser,
  POSTFIX,
  DASH,
} from "@/app/inspector/import-family-search/parsers/utils";

const MUSEUM_PREFIX = `[ТтTt][ФфFf]`;

const descriptionRegexp = new RegExp(
  `(${MUSEUM_PREFIX})[${DASH}]+(\\d+${POSTFIX})`,
  "i"
);
const singleRegexp = new RegExp(
  `(${MUSEUM_PREFIX})[${DASH}]+(\\d+${POSTFIX})[${DASH}]+(\\d+\\s{0,1}${POSTFIX})`,
  "i"
);
const rangeRegexp = new RegExp(
  `(${MUSEUM_PREFIX})[${DASH}]+(\\d+${POSTFIX})[${DASH}]+(\\d+\\s{0,1}${POSTFIX})[${DASH}]+(\\d+\\s{0,1}${POSTFIX})`,
  "i"
);

const museumParser: Parser = {
  example: "ТФ-5152-20",
  test: (item) =>
    testItem(
      new RegExp(`^\\s*${MUSEUM_PREFIX}[${DASH}]+\\d+`, "i"),
      item
    ),
  parse: (item) => {
    const toProcess: string[] = [];
    const multi = testItem(/;/, item);
    if (multi && !item.dgs.includes("_")) {
      toProcess.push(...multi.split(";").map((s) => s.trim()));
    } else {
      toProcess.push(
        testItem(singleRegexp, item) ||
          testItem(rangeRegexp, item) ||
          testItem(descriptionRegexp, item)
      );
    }

    const results: string[][] = [];
    for (const part of toProcess) {
      const clean = part
        .replace(new RegExp(`\\s?[${DASH}]\\s?`, "g"), "-")
        .trim();
      if (rangeRegexp.test(clean)) {
        const match = clean.match(rangeRegexp);
        if (!match) return [];
        const [_, prefix, d, cStart, cEnd] = match;
        const fund = `${prefix.toUpperCase()}1`;
        if (cEnd) {
          const startNum = parseInt(cStart.replace(/\D/g, ""), 10);
          const endNum = parseInt(cEnd.replace(/\D/g, ""), 10);
          if (
            endNum <= startNum ||
            endNum - startNum > (item.image_count || 0)
          ) {
            results.push([fund, d, cStart]);
            continue;
          }
          results.push([fund, d, cStart]);
          for (let i = startNum + 1; i < endNum; i++) {
            results.push([fund, d, i.toString()]);
          }
          results.push([fund, d, cEnd]);
        } else {
          results.push([fund, d, cStart]);
        }
      } else if (singleRegexp.test(clean)) {
        const match = clean.match(singleRegexp);
        if (!match) return [];
        const [_, prefix, d, c] = match;
        const fund = `${prefix.toUpperCase()}1`;
        results.push([fund, d, c]);
      } else if (descriptionRegexp.test(clean)) {
        const match = clean.match(descriptionRegexp);
        if (!match) return [];
        const [_, prefix, d] = match;
        const fund = `${prefix.toUpperCase()}1`;
        results.push([fund, d]);
      }
    }

    return results;
  },
};

export default museumParser;
