import {
  testItem,
  Parser,
  POSTFIX,
  DASH,
  PREFIX,
} from "@/app/inspector/import-family-search/parsers/utils";

const P = `${PREFIX}{0,1}[${DASH}]{0,1}`;

const singleRegexp = new RegExp(
  `(${P}\\d+${POSTFIX})[${DASH}]+(\\d+${POSTFIX})[${DASH}]+(\\d+${POSTFIX})`,
  "i"
);
const rangeRegexp = new RegExp(
  `(${P}\\d+${POSTFIX})[${DASH}]+(\\d+${POSTFIX})[${DASH}]+(\\d+${POSTFIX})[${DASH}]+(\\d+${POSTFIX})`,
  "i"
);

const shortParser: Parser = {
  example: "37-3-129",
  test: (item) =>
    testItem(
      new RegExp(
        `^(${P}\\d+${POSTFIX})[${DASH}]+(\\d+${POSTFIX})[${DASH}]+(\\d+${POSTFIX})`,
        "i"
      ),
      item
    ),
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
      const clean = part.replace(new RegExp(`\\s?[${DASH}]\\s?`, "g"), "-").trim();
      if (rangeRegexp.test(clean)) {
        const match = clean.match(rangeRegexp);
        if (!match) return [];
        const [_, f, d, cStart, cEnd] = match;
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
        const [_, f, d, c] = match;
        results.push([f, d, c]);
      }
    }

    return results;
  },
};

export default shortParser;
