import { FSItemsFreshResponse } from "@/app/api/inspector/fs-items/fresh/route";
import { parseCode } from "@duckarchive/framework";
import { get, setWith, uniq } from "lodash";

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

export const parseMeta = (str: string): MetaItem[] => {
  return str
    .split(" -- ")
    .map((itemStr) => {
      let m = null;
      for (const { test, match, pre, post } of templates) {
        if (test.test(itemStr)) {
          if (pre) {
            m = pre(itemStr).match(match);
          } else {
            m = itemStr.match(match);
          }
          if (post) {
            m = post(m);
          }
          break;
        }
      }

      if (!m) {
        console.error("Invalid meta", { text: itemStr });
        return null;
      }

      const [_, f, d, c, ce] = m;

      return {
        raw: itemStr,
        fund: f.trim(),
        description: d.trim(),
        casesRange: [c.trim(), ce?.slice(1).trim()],
      };
    })
    .filter(Boolean) as MetaItem[];
};


const CYRILLIC = "[А-ЯҐЄІЇ]";
const PREFIX = "[РПН]";
const DELIMITER = "[ ,;./_–—―-]";
const POSTFIX = "[A-ZА-ЯҐЄІЇ.]*";

const regexps = [
  new RegExp(
    `(${PREFIX}?${DELIMITER}?\\d+${POSTFIX})${DELIMITER}(\\d+${POSTFIX})${DELIMITER}(\\d+${POSTFIX})`,
    "i"
  )
];

export const autoParseFSItem = (item?: FSItemsFreshResponse[number]): string[] => {
  if (!item) return [];
  const a = item.project.archive?.code || "";

  const [_, f, d, c] = (regexps.find((r) => r.test(item.volume || ""))?.exec(item.volume || "") || []).map(raw => parseCode(raw));

  return [[a, f, d, c].join("-")];
};