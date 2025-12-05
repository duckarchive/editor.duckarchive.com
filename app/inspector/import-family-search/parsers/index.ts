import { FSItemsFreshResponse } from "@/app/api/inspector/fs-import/route";
import classicParser from "@/app/inspector/import-family-search/parsers/classic.parser";
import shortWithLatinPrefixParser from "@/app/inspector/import-family-search/parsers/short-with-latin-prefix.parser";
import shortParser from "@/app/inspector/import-family-search/parsers/short.parser";
import tempParser from "@/app/inspector/import-family-search/parsers/temp.parser";
import { Parser } from "@/app/inspector/import-family-search/parsers/utils";
import volumeParser from "@/app/inspector/import-family-search/parsers/volume.parser";
import { parseCode } from "@duckarchive/framework";

const latin2cyrillic = (str: string): string => {
  const charMap: Record<string, string> = {
    a: "а",
    b: "б",
    c: "ц",
    d: "д",
    e: "е",
    f: "ф",
    g: "г",
    h: "х",
    i: "и",
    j: "й",
    k: "к",
    l: "л",
    m: "м",
    n: "н",
    o: "о",
    p: "п",
    q: "к",
    r: "р",
    s: "с",
    t: "т",
    u: "у",
    v: "в",
    w: "в",
    y: "и",
    z: "з",
  };

  return str
    .split("")
    .map((char) => (charMap[char.toLowerCase()] || char).toUpperCase())
    .join("");
};

interface MetaItem {
  raw: string;
  fund: string;
  description: string;
  casesRange: [string, string?];
}

const del = "[., ]+";
const sub = "[абвдоп. ]{0,5}";
const cyrillic = "[А-ЯҐЄІЇ]";

const templates: {
  test: RegExp;
  match: RegExp;
  pre?: (str: string) => string;
  post?: (matchResult: string[] | null) => string[] | null;
}[] = [
  {
    test: new RegExp(`^ф${del}([рп]?-?\\d+${sub})-(\\d+${sub})`, "i"),
    pre: latin2cyrillic,
    match: new RegExp(
      `ф${del}([рп]?-?\\d+${sub})-(\\d+${sub})/(\\d+${sub})`,
      "i"
    ),
  },
  {
    test: new RegExp(`^ф${del}`, "i"),
    pre: latin2cyrillic,
    match: new RegExp(
      `ф${del}([рп]?-?\\d+${sub})${del}о${del}(\\d+${sub})${del}д${del}(\\d+${sub})(?:-\\d+${sub})?${del}`,
      "i"
    ),
  },
  {
    test: new RegExp(`^фонд${del}`, "i"),
    pre: latin2cyrillic,
    match: new RegExp(
      `фонд${del}([рп]?-?\\d+${sub})${del}опись?${del}(\\d+${sub})${del}дело${del}(\\d+${sub})(?:-\\d+${sub})?${del}`,
      "i"
    ),
  },
  {
    test: new RegExp(`^vol`, "i"),
    pre: latin2cyrillic,
    match: new RegExp(
      `вол${cyrillic}{0,4}${del}([рп]?-?\\d+${sub})-(\\d+${sub})/(\\d+${sub})[ \\(цонт\.\\)]{0,8}(-\\d+${sub})?`,
      "i"
    ),
  },
];

const parsers: Parser[] = [
  // tempParser,
  volumeParser,
  shortParser,
  shortWithLatinPrefixParser,
  classicParser,
];

export const autoParseFSItem = (item?: FSItemsFreshResponse[number]): string[] => {
  if (!item) return [];
  const a = item.project.archive?.code || "";
  const parser = parsers.find(({ test }) => test(item));

  if (!parser) return [];

  // const [_, f, d, c] = parser.parse(item)?.map(raw => parseCode(raw)) || [];

  return parser.parse(item).map((parts) => [a, ...parts.map(part => parseCode(part, true))].join("-"));
};