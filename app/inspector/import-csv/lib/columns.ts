import { StructureType, TargetLevel } from "./types";

export interface DbField {
  key: string;
  label: string;
  group: string;
  required?: boolean;
}

interface StructureConfig {
  level1Label: string;
  level2Label: string;
  level3Label: string;
  fields: DbField[];
}

const FUND_DESCRIPTION_CASE: StructureConfig = {
  level1Label: "Фонд",
  level2Label: "Опис",
  level3Label: "Справа",
  fields: [
    { key: "level1_code", label: "Код фонду", group: "Фонд", required: true },
    { key: "level1_title", label: "Назва фонду", group: "Фонд" },
    { key: "level1_info", label: "Інформація фонду", group: "Фонд" },
    { key: "level2_code", label: "Код опису", group: "Опис", required: true },
    { key: "level2_title", label: "Назва опису", group: "Опис" },
    { key: "level2_info", label: "Інформація опису", group: "Опис" },
    { key: "level3_code", label: "Код справи", group: "Справа" },
    { key: "level3_full_code", label: "Повний шифр справи", group: "Справа" },
    { key: "level3_title", label: "Назва справи", group: "Справа" },
    { key: "level3_info", label: "Інформація справи", group: "Справа" },
    { key: "level3_tags", label: "Теги справи", group: "Справа" },
    { key: "years", label: "Роки (одне поле)", group: "Роки" },
    { key: "start_year", label: "Рік початку", group: "Роки" },
    { key: "end_year", label: "Рік кінця", group: "Роки" },
  ],
};

const FOND_INVENTORY_FILE: StructureConfig = {
  level1Label: "Фонд",
  level2Label: "Інвентар",
  level3Label: "Файл",
  fields: [
    { key: "level1_code", label: "Код фонду", group: "Фонд", required: true },
    { key: "level1_title", label: "Назва фонду", group: "Фонд" },
    { key: "level1_info", label: "Інформація фонду", group: "Фонд" },
    { key: "level2_code", label: "Код інвентару", group: "Інвентар", required: true },
    { key: "level2_title", label: "Назва інвентару", group: "Інвентар" },
    { key: "level2_info", label: "Інформація інвентару", group: "Інвентар" },
    { key: "level3_code", label: "Код файлу", group: "Файл" },
    { key: "level3_full_code", label: "Повний шифр файлу", group: "Файл" },
    { key: "level3_title", label: "Назва файлу", group: "Файл" },
    { key: "level3_info", label: "Інформація файлу", group: "Файл" },
    { key: "level3_tags", label: "Теги файлу", group: "Файл" },
    { key: "years", label: "Роки (одне поле)", group: "Роки" },
    { key: "start_year", label: "Рік початку", group: "Роки" },
    { key: "end_year", label: "Рік кінця", group: "Роки" },
  ],
};

export function getStructureConfig(structureType: StructureType): StructureConfig {
  return structureType === "fund-description-case" ? FUND_DESCRIPTION_CASE : FOND_INVENTORY_FILE;
}

export function getAvailableFields(structureType: StructureType, targetLevel: TargetLevel): DbField[] {
  const config = getStructureConfig(structureType);
  if (targetLevel === "level2") {
    return config.fields.filter((f) => !f.key.startsWith("level3_"));
  }
  return config.fields;
}

export function getRequiredFields(structureType: StructureType, targetLevel: TargetLevel): string[] {
  const fields = getAvailableFields(structureType, targetLevel);
  const required = fields.filter((f) => f.required).map((f) => f.key);
  if (targetLevel === "level3") {
    required.push("level3_code");
  }
  return required;
}
