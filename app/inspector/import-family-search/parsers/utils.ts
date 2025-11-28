import { FSItemsFreshResponse } from "@/app/api/inspector/fs-import/route";

export const CYRILLIC = "[А-ЯҐЄІЇ]";
export const PREFIX = "[РПН]";
export const DASH = "–—―-";
export const DELIMITER = `[ ,;./_${DASH}]`;
export const POSTFIX = "[A-ZА-ЯҐЄІЇ.]*";

export interface Parser {
  example?: string;
  test: (item: FSItemsFreshResponse[number]) => string;
  parse: (item: FSItemsFreshResponse[number]) => string[][];
}

export const testItem = (reg: RegExp, item: FSItemsFreshResponse[number]): string => {
  const volume = item.volume?.trim() || "";
  if (reg.test(volume)) {
    return volume;
  }

  const volumes = item.volumes?.trim() || "";
  if (reg.test(volumes)) {
    return volumes;
  }

  const archival_reference = item.archival_reference?.trim() || "";
  if (reg.test(archival_reference)) {
    return archival_reference;
  }

  return "";
};
export const matchItem = (reg: RegExp, item: FSItemsFreshResponse[number]): RegExpMatchArray | null => {
  return (item.volume?.trim() || "").match(reg) || (item.volumes?.trim() || "").match(reg) || (item.archival_reference?.trim() || "").match(reg);
};