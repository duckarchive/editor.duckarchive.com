import { FSItemsFreshResponse } from "@/app/api/inspector/fs-import/route";

export const CYRILLIC = "[А-ЯҐЄІЇ]";
export const PREFIX = "[РПН]";
export const DELIMITER = "[ ,;./_–—―-]";
export const POSTFIX = "[A-ZА-ЯҐЄІЇ.]*";

export interface Parser {
  example?: string;
  test: (item: FSItemsFreshResponse[number]) => boolean;
  parse: (item: FSItemsFreshResponse[number]) => string[][];
}

export const testItem = (reg: RegExp, item: FSItemsFreshResponse[number]): boolean => {
  return reg.test(item.volumes?.trim() || "") || reg.test(item.volume?.trim() || "") || reg.test(item.archival_reference?.trim() || "");
};
export const execItem = (reg: RegExp, item: FSItemsFreshResponse[number]): RegExpExecArray | null => {
  return reg.exec(item.volumes?.trim() || "") || reg.exec(item.volume?.trim() || "") || reg.exec(item.archival_reference?.trim() || "");
};