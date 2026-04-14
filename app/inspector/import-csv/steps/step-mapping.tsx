"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { getAvailableFields, getRequiredFields } from "../lib/columns";
import { autoMapColumns } from "../lib/auto-map";
import { getStructureConfig } from "../lib/columns";
import { ColumnMapping, CodeOverrides, StructureType, TargetLevel } from "../lib/types";

interface StepMappingProps {
  csvHeaders: string[];
  csvRows: Record<string, string>[];
  structureType: StructureType;
  targetLevel: TargetLevel;
  initialMapping: ColumnMapping;
  initialCodeOverrides: CodeOverrides;
  onComplete: (mapping: ColumnMapping, codeOverrides: CodeOverrides) => void;
  onBack: () => void;
}

const StepMapping: React.FC<StepMappingProps> = ({
  csvHeaders,
  csvRows,
  structureType,
  targetLevel,
  initialMapping,
  initialCodeOverrides,
  onComplete,
  onBack,
}) => {
  const availableFields = getAvailableFields(structureType, targetLevel);
  const requiredFields = getRequiredFields(structureType, targetLevel);
  const structureConfig = getStructureConfig(structureType);

  const [mapping, setMapping] = useState<ColumnMapping>(() => {
    if (Object.values(initialMapping).some((v) => v !== "")) {
      return initialMapping;
    }
    return autoMapColumns(csvHeaders, availableFields);
  });

  const [codeOverrides, setCodeOverrides] = useState<CodeOverrides>(initialCodeOverrides);

  const usedFields = new Set(Object.values(mapping).filter(Boolean));

  const handleChange = (csvHeader: string, dbField: string) => {
    setMapping((prev) => ({ ...prev, [csvHeader]: dbField }));
  };

  // A required field is satisfied if it's mapped from CSV OR has a code override
  const mappedFields = new Set(Object.values(mapping).filter(Boolean));
  const missingRequired = requiredFields.filter((f) => {
    if (mappedFields.has(f)) return false;
    if (f === "level1_code" && codeOverrides.level1_code?.trim()) return false;
    if (f === "level2_code" && codeOverrides.level2_code?.trim()) return false;
    return true;
  });
  const isValid = missingRequired.length === 0;

  const sampleRows = csvRows.slice(0, 3);

  // Group available fields by group
  const fieldsByGroup: Record<string, typeof availableFields> = {};
  for (const field of availableFields) {
    if (!fieldsByGroup[field.group]) fieldsByGroup[field.group] = [];
    fieldsByGroup[field.group].push(field);
  }

  const l1CodeMapped = mappedFields.has("level1_code");
  const l2CodeMapped = mappedFields.has("level2_code");

  return (
    <div className="flex flex-col gap-4">
      {/* Code overrides — for CSVs without fund/description columns */}
      <div className="flex gap-4 items-end">
        <Input
          size="sm"
          label={`Код ${structureConfig.level1Label.toLowerCase()} (для всіх рядків)`}
          placeholder={l1CodeMapped ? "Замаплено з CSV" : "Напр. 123"}
          value={codeOverrides.level1_code || ""}
          onValueChange={(val) => setCodeOverrides((prev) => ({ ...prev, level1_code: val }))}
          isDisabled={l1CodeMapped}
          className="max-w-48"
        />
        <Input
          size="sm"
          label={`Код ${structureConfig.level2Label.toLowerCase()} (для всіх рядків)`}
          placeholder={l2CodeMapped ? "Замаплено з CSV" : "Напр. 1"}
          value={codeOverrides.level2_code || ""}
          onValueChange={(val) => setCodeOverrides((prev) => ({ ...prev, level2_code: val }))}
          isDisabled={l2CodeMapped}
          className="max-w-48"
        />
      </div>

      <div className="overflow-auto max-h-[calc(100vh-280px)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-medium">Колонка CSV</th>
              <th className="text-left p-2 font-medium">Приклад значень</th>
              <th className="text-left p-2 font-medium w-72">Поле в базі даних</th>
            </tr>
          </thead>
          <tbody>
            {csvHeaders.map((header) => {
              const currentValue = mapping[header] || "";
              const isRequiredAndMissing =
                currentValue === "" &&
                requiredFields.some((rf) => {
                  if (rf === "level1_code" && codeOverrides.level1_code?.trim()) return false;
                  if (rf === "level2_code" && codeOverrides.level2_code?.trim()) return false;
                  return !Object.values(mapping).includes(rf);
                });

              return (
                <tr key={header} className="border-b">
                  <td className="p-2 font-mono">{header}</td>
                  <td className="p-2 text-default-400 max-w-xs truncate">
                    {sampleRows
                      .map((row) => row[header])
                      .filter(Boolean)
                      .join(" | ")}
                  </td>
                  <td className="p-2">
                    <Select
                      size="sm"
                      selectedKeys={currentValue ? [currentValue] : []}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        handleChange(header, val || "");
                      }}
                      placeholder="-- Пропустити --"
                      className={`w-72 ${isRequiredAndMissing ? "ring-2 ring-danger rounded-xl" : ""}`}
                    >
                      {Object.entries(fieldsByGroup).flatMap(([group, fields]) =>
                        fields.map((field) => (
                          <SelectItem
                            key={field.key}
                            isDisabled={usedFields.has(field.key) && mapping[header] !== field.key}
                            textValue={`${group}: ${field.label}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-default-400 text-xs">{group}:</span>
                              <span>{field.label}</span>
                              {field.required && <span className="text-danger">*</span>}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {missingRequired.length > 0 && (
        <p className="text-danger text-sm">
          Обов&apos;язкові поля не замаплені:{" "}
          {missingRequired
            .map((f) => availableFields.find((af) => af.key === f)?.label || f)
            .join(", ")}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="bordered" onPress={onBack}>
          Назад
        </Button>
        <Button color="primary" isDisabled={!isValid} onPress={() => onComplete(mapping, codeOverrides)}>
          Далі
        </Button>
      </div>
    </div>
  );
};

export default StepMapping;
