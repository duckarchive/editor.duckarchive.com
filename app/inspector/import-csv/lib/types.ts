export type StructureType = "fund-description-case" | "fond-inventory-file";
export type TargetLevel = "level2" | "level3";
export type ConflictMode = "overwrite" | "skip";

export interface ConflictConfig {
  level1: ConflictMode;
  level2: ConflictMode;
  level3: ConflictMode;
}

export interface ColumnMapping {
  [csvHeader: string]: string; // csvHeader -> dbField key or "" for skip
}

export interface CheckResult {
  level1: { create: number; update: number; skip: number };
  level2: { create: number; update: number; skip: number };
  level3: { create: number; update: number; skip: number };
  errors: { row: number; message: string }[];
}

export interface ImportResult {
  processedCount: number;
  successCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
}

export interface CodeOverrides {
  level1_code?: string;
  level2_code?: string;
}

export interface ImportPayload {
  rows: Record<string, string>[];
  mapping: ColumnMapping;
  structureType: StructureType;
  archiveId: string;
  conflictConfig: ConflictConfig;
  targetLevel: TargetLevel;
  codeOverrides: CodeOverrides;
}

export interface WizardState {
  step: 1 | 2 | 3;
  archiveId: string;
  structureType: StructureType;
  targetLevel: TargetLevel;
  csvHeaders: string[];
  csvRows: Record<string, string>[];
  columnMapping: ColumnMapping;
  conflictConfig: ConflictConfig;
  codeOverrides: CodeOverrides;
}
