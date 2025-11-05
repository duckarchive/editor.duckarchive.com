import { testItem, execItem, Parser, POSTFIX, DELIMITER } from "@/app/inspector/import-family-search/parsers/utils";

const testRegexp = /^Vol\w{0,3}/;
const parseRegexp = new RegExp(
  `^Vol\\w{0,3}\\s*(\\d+${POSTFIX})${DELIMITER}(\\d+${POSTFIX})${DELIMITER}(\\d+${POSTFIX})${DELIMITER}?(\\d+${POSTFIX})?`,
  "i"
);

const volumeParser: Parser = {
  example: "Volume 5593-2/779",
  test: (item) => testItem(testRegexp, item),
  parse: (item) => {
    const match = execItem(parseRegexp, item);
    if (!match) return [];
    const [_, f, d, cStart, cEnd] = match;
    const results: string[][] = [];
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
    return results;
  },
};

export default volumeParser;
