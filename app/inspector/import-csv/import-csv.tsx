"use client";

import { useState } from "react";
import { Archive } from "@generated/prisma/inspector/client/client";
import { WizardState, ColumnMapping, ConflictConfig, CodeOverrides } from "./lib/types";
import StepUpload from "./steps/step-upload";
import StepMapping from "./steps/step-mapping";
import StepReview from "./steps/step-review";

const STEPS = [
  { number: 1, label: "Файл" },
  { number: 2, label: "Мапінг" },
  { number: 3, label: "Імпорт" },
];

interface ImportCsvProps {
  archives: Archive[];
}

const ImportCsv: React.FC<ImportCsvProps> = ({ archives }) => {
  const [state, setState] = useState<WizardState>({
    step: 1,
    archiveId: "",
    structureType: "fund-description-case",
    targetLevel: "level3",
    csvHeaders: [],
    csvRows: [],
    columnMapping: {},
    conflictConfig: { level1: "skip", level2: "skip", level3: "skip" },
    codeOverrides: {},
  });

  const handleUploadComplete = (
    archiveId: string,
    structureType: WizardState["structureType"],
    targetLevel: WizardState["targetLevel"],
    headers: string[],
    rows: Record<string, string>[]
  ) => {
    setState((prev) => ({
      ...prev,
      step: 2,
      archiveId,
      structureType,
      targetLevel,
      csvHeaders: headers,
      csvRows: rows,
    }));
  };

  const handleMappingComplete = (mapping: ColumnMapping, codeOverrides: CodeOverrides) => {
    setState((prev) => ({ ...prev, step: 3, columnMapping: mapping, codeOverrides }));
  };

  const handleConflictConfigChange = (config: ConflictConfig) => {
    setState((prev) => ({ ...prev, conflictConfig: config }));
  };

  const handleBack = () => {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as WizardState["step"],
    }));
  };

  const handleReset = () => {
    setState({
      step: 1,
      archiveId: "",
      structureType: "fund-description-case",
      targetLevel: "level3",
      csvHeaders: [],
      csvRows: [],
      columnMapping: {},
      conflictConfig: { level1: "skip", level2: "skip", level3: "skip" },
      codeOverrides: {},
    });
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                state.step === s.number
                  ? "bg-primary text-white"
                  : state.step > s.number
                    ? "bg-success-100 text-success-700"
                    : "bg-default-100 text-default-500"
              }`}
            >
              <span>{s.number}</span>
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-default-300" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 min-h-0">
        {state.step === 1 && (
          <StepUpload archives={archives} onComplete={handleUploadComplete} />
        )}
        {state.step === 2 && (
          <StepMapping
            csvHeaders={state.csvHeaders}
            csvRows={state.csvRows}
            structureType={state.structureType}
            targetLevel={state.targetLevel}
            initialMapping={state.columnMapping}
            initialCodeOverrides={state.codeOverrides}
            onComplete={handleMappingComplete}
            onBack={handleBack}
          />
        )}
        {state.step === 3 && (
          <StepReview
            state={state}
            onConflictConfigChange={handleConflictConfigChange}
            onBack={handleBack}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
};

export default ImportCsv;
