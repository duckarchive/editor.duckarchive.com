"use client";

import { useState, useRef } from "react";
import { Archive } from "@generated/prisma/inspector/client/client";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import SelectArchive from "@/components/select-archive";
import Papa from "papaparse";
import { StructureType, TargetLevel } from "../lib/types";

interface StepUploadProps {
  archives: Archive[];
  onComplete: (
    archiveId: string,
    structureType: StructureType,
    targetLevel: TargetLevel,
    headers: string[],
    rows: Record<string, string>[]
  ) => void;
}

const StepUpload: React.FC<StepUploadProps> = ({ archives, onComplete }) => {
  const [archiveId, setArchiveId] = useState<string>("");
  const [structureType, setStructureType] = useState<StructureType>("fund-description-case");
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("level3");
  const [fileName, setFileName] = useState<string>("");
  const [rowCount, setRowCount] = useState<number>(0);
  const [headerCount, setHeaderCount] = useState<number>(0);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Помилка парсингу: ${results.errors[0].message}`);
          return;
        }
        const headers = results.meta.fields || [];
        if (headers.length === 0) {
          setError("Не вдалося визначити колонки CSV");
          return;
        }
        setParsedHeaders(headers);
        setParsedRows(results.data);
        setHeaderCount(headers.length);
        setRowCount(results.data.length);
      },
      error: (err) => {
        setError(`Помилка читання файлу: ${err.message}`);
      },
    });
  };

  const isReady = archiveId && parsedHeaders.length > 0 && parsedRows.length > 0;

  const handleNext = () => {
    if (isReady) {
      onComplete(archiveId, structureType, targetLevel, parsedHeaders, parsedRows);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <SelectArchive
        archives={archives}
        value={archiveId}
        onChange={(key) => setArchiveId(key as string)}
      />

      <Select
        label="Структура"
        selectedKeys={[structureType]}
        onSelectionChange={(keys) => {
          const val = Array.from(keys)[0] as StructureType;
          if (val) setStructureType(val);
        }}
      >
        <SelectItem key="fund-description-case">Фонд / Опис / Справа</SelectItem>
        <SelectItem key="fond-inventory-file">Фонд / Інвентар / Файл</SelectItem>
      </Select>

      <Select
        label="Рівень імпорту"
        selectedKeys={[targetLevel]}
        onSelectionChange={(keys) => {
          const val = Array.from(keys)[0] as TargetLevel;
          if (val) setTargetLevel(val);
        }}
      >
        <SelectItem key="level2">
          {structureType === "fund-description-case" ? "Описи" : "Інвентарі"}
        </SelectItem>
        <SelectItem key="level3">
          {structureType === "fund-description-case" ? "Справи" : "Файли"}
        </SelectItem>
      </Select>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="bordered"
          onPress={() => fileInputRef.current?.click()}
        >
          {fileName || "Обрати CSV файл"}
        </Button>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}

      {parsedHeaders.length > 0 && (
        <p className="text-sm text-default-500">
          Знайдено {rowCount} рядків та {headerCount} колонок
        </p>
      )}

      <div>
        <Button color="primary" isDisabled={!isReady} onPress={handleNext}>
          Далі
        </Button>
      </div>
    </div>
  );
};

export default StepUpload;
