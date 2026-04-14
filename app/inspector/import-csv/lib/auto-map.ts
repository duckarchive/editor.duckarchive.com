import { DbField } from "./columns";
import { ColumnMapping } from "./types";

const MATCH_DICTIONARY: Record<string, string[]> = {
  level1_code: ["фонд", "fund", "ф.", "fond", "фонд №", "фонд №", "номер фонду"],
  level1_title: ["назва фонду", "fund title", "fund name"],
  level1_info: ["інформація фонду", "fund info", "fund notes"],
  level2_code: ["опис", "description", "оп.", "опись", "inventory", "інвентар", "інв.", "номер опису"],
  level2_title: ["назва опису", "description title", "inventory title"],
  level2_info: ["інформація опису", "description info", "inventory info"],
  level3_code: ["справа", "case", "спр.", "дело", "file", "файл", "номер справи"],
  level3_full_code: ["шифр", "full_code", "повний код", "реквізити", "повний шифр"],
  level3_title: ["назва справи", "case title", "file title", "назва", "title", "заголовок", "название"],
  level3_info: ["примітки", "info", "notes", "інформація", "примечания", "коментар"],
  level3_tags: ["теги", "tags", "мітки", "ключові слова"],
  years: ["роки", "years", "рік", "дати", "dates", "date", "дата", "період", "period"],
  start_year: ["рік початку", "start_year", "рік від", "від", "дата початку", "початковий рік", "start year"],
  end_year: ["рік кінця", "end_year", "рік до", "до", "дата закінчення", "кінцевий рік", "end year"],
};

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[_\-\.]/g, " ");
}

function score(csvHeader: string, dbFieldKey: string): number {
  const normalizedHeader = normalize(csvHeader);
  const terms = MATCH_DICTIONARY[dbFieldKey] || [];

  for (const term of terms) {
    if (normalizedHeader === normalize(term)) return 100;
  }
  for (const term of terms) {
    if (normalizedHeader.includes(normalize(term)) || normalize(term).includes(normalizedHeader)) return 50;
  }

  // Also try matching the db field key directly
  const normalizedKey = normalize(dbFieldKey.replace("level1_", "").replace("level2_", "").replace("level3_", ""));
  if (normalizedHeader === normalizedKey) return 40;
  if (normalizedHeader.includes(normalizedKey)) return 20;

  return 0;
}

export function autoMapColumns(csvHeaders: string[], availableFields: DbField[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<string>();

  // Score all possible pairs
  const pairs: { header: string; field: string; score: number }[] = [];
  for (const header of csvHeaders) {
    for (const field of availableFields) {
      const s = score(header, field.key);
      if (s > 0) {
        pairs.push({ header, field: field.key, score: s });
      }
    }
  }

  // Sort by score descending, assign greedily
  pairs.sort((a, b) => b.score - a.score);

  for (const pair of pairs) {
    if (mapping[pair.header] || usedFields.has(pair.field)) continue;
    mapping[pair.header] = pair.field;
    usedFields.add(pair.field);
  }

  // Set unmapped headers to empty string (skip)
  for (const header of csvHeaders) {
    if (!mapping[header]) {
      mapping[header] = "";
    }
  }

  return mapping;
}
