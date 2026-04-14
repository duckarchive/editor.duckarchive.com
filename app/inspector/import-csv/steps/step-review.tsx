"use client";

import { useState, useMemo } from "react";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Spinner } from "@heroui/spinner";
import InspectorTable from "@/components/inspector-table";
import { usePost } from "@/hooks/useApi";
import { getStructureConfig, getAvailableFields } from "../lib/columns";
import {
  WizardState,
  ConflictConfig,
  ConflictMode,
  CheckResult,
  ImportResult,
} from "../lib/types";

interface StepReviewProps {
  state: WizardState;
  onConflictConfigChange: (config: ConflictConfig) => void;
  onBack: () => void;
  onReset: () => void;
}

const StepReview: React.FC<StepReviewProps> = ({
  state,
  onConflictConfigChange,
  onBack,
  onReset,
}) => {
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { trigger: check, isMutating: isChecking } = usePost<CheckResult, any>(
    "/api/inspector/import-csv/check"
  );
  const { trigger: importData, isMutating: isImporting } = usePost<ImportResult, any>(
    "/api/inspector/import-csv"
  );

  const structureConfig = getStructureConfig(state.structureType);
  const availableFields = getAvailableFields(state.structureType, state.targetLevel);

  const handleToggle = (level: keyof ConflictConfig, value: boolean) => {
    const mode: ConflictMode = value ? "overwrite" : "skip";
    onConflictConfigChange({ ...state.conflictConfig, [level]: mode });
  };

  const payload = useMemo(
    () => ({
      rows: state.csvRows,
      mapping: state.columnMapping,
      structureType: state.structureType,
      archiveId: state.archiveId,
      conflictConfig: state.conflictConfig,
      targetLevel: state.targetLevel,
      codeOverrides: state.codeOverrides,
    }),
    [state]
  );

  const handleCheck = async () => {
    const result = await check(payload);
    if (result) setCheckResult(result);
  };

  const handleImport = async () => {
    const result = await importData(payload);
    if (result) setImportResult(result);
  };

  // Build preview columns from mapping
  const previewColumns = useMemo(() => {
    const mapped = Object.entries(state.columnMapping).filter(([, dbField]) => dbField);
    return mapped.map(([csvHeader, dbField]) => {
      const fieldDef = availableFields.find((f) => f.key === dbField);
      return {
        field: csvHeader,
        headerName: fieldDef?.label || dbField,
        filter: true,
        flex: 1,
      };
    });
  }, [state.columnMapping, availableFields]);

  const levels: { key: keyof ConflictConfig; label: string }[] = [
    { key: "level1", label: structureConfig.level1Label },
    { key: "level2", label: structureConfig.level2Label },
    ...(state.targetLevel === "level3"
      ? [{ key: "level3" as const, label: structureConfig.level3Label }]
      : []),
  ];

  if (importResult) {
    return (
      <div className="flex flex-col gap-4 max-w-xl">
        <h2 className="text-xl font-bold text-success">Імпорт завершено</h2>
        <div className="text-sm space-y-1">
          <p>Оброблено: {importResult.processedCount}</p>
          <p>Успішно: {importResult.successCount}</p>
          {importResult.errorCount > 0 && (
            <p className="text-danger">Помилок: {importResult.errorCount}</p>
          )}
        </div>
        {importResult.errors.length > 0 && (
          <div className="max-h-40 overflow-auto text-sm text-danger">
            {importResult.errors.map((err, i) => (
              <p key={i}>
                Рядок {err.row}: {err.message}
              </p>
            ))}
          </div>
        )}
        <Button color="primary" onPress={onReset}>
          Новий імпорт
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Conflict resolution */}
      <div className="flex gap-6 items-center">
        <span className="text-sm font-medium">При збігу:</span>
        {levels.map(({ key, label }) => (
          <Switch
            key={key}
            size="sm"
            isSelected={state.conflictConfig[key] === "overwrite"}
            onValueChange={(val) => handleToggle(key, val)}
          >
            <span className="text-sm">
              {label}: {state.conflictConfig[key] === "overwrite" ? "Перезаписати" : "Пропустити"}
            </span>
          </Switch>
        ))}
      </div>

      {/* Preview table */}
      <div className="flex-1 min-h-0">
        <InspectorTable
          columns={previewColumns}
          rows={state.csvRows}
          onSelectionChanged={() => {}}
          onFilterChanged={() => {}}
        />
      </div>

      {/* Check results */}
      {checkResult && (
        <div className="flex gap-4 text-sm">
          {levels.map(({ key, label }) => (
            <div key={key} className="flex gap-2 items-center">
              <span className="font-medium">{label}:</span>
              <span className="text-success">{checkResult[key].create} створити</span>
              <span className="text-warning">{checkResult[key].update} оновити</span>
              <span className="text-default-400">{checkResult[key].skip} пропустити</span>
            </div>
          ))}
          {checkResult.errors.length > 0 && (
            <span className="text-danger">{checkResult.errors.length} помилок</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="bordered" onPress={onBack}>
          Назад
        </Button>
        <Button
          color="warning"
          variant="bordered"
          onPress={handleCheck}
          isLoading={isChecking}
        >
          Перевірити
        </Button>
        <Button
          color="success"
          onPress={handleImport}
          isLoading={isImporting}
          isDisabled={!checkResult}
        >
          Імпортувати
        </Button>
      </div>
    </div>
  );
};

export default StepReview;
