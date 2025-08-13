import { ColDef } from "ag-grid-community";

import catalog from "@/generated/prisma/catalog-client/runtime/library";
import duckarchive from "@/generated/prisma/duckarchive-client/runtime/library";
import duckkey from "@/generated/prisma/duckkey-client/runtime/library";
import inspector from "@/generated/prisma/inspector-client/runtime/library";

const READONLY_FIELDS: string[] = [];
const HIDDEN_FIELDS: string[] = ["id"];

type BaseDMMF =
  | catalog.BaseDMMF
  | duckarchive.BaseDMMF
  | duckkey.BaseDMMF
  | inspector.BaseDMMF;

interface PrismaInstanceAgGrid {
  [instance: string]: ColDef[];
}

const createColumnsForModel = (
  model: BaseDMMF["datamodel"]["models"][number]
): ColDef[] => {
  const columns: ColDef[] = [];

  model.fields.forEach((field) => {
    if (!field.relationName && !HIDDEN_FIELDS.includes(field.name)) {
      const isReadonly = READONLY_FIELDS.includes(field.name);

      columns.push({
        field: field.name,
        headerName: field.name,
        sortable: isReadonly ? false : true,
        filter: isReadonly ? false : true,
        resizable: isReadonly ? false : true,
        cellStyle: isReadonly ? { opacity: 0.5 } : {},
      });
    }
  });

  return columns;
};

const prisma2agGrid = (dmmf: BaseDMMF): PrismaInstanceAgGrid => {
  const columnsHashTable: PrismaInstanceAgGrid = {};

  const models = dmmf.datamodel.models;

  models.forEach((model) => {
    columnsHashTable[model.dbName || model.name.toLowerCase()] =
      createColumnsForModel(model);
  });

  console.log(columnsHashTable);

  return columnsHashTable;
};

export default prisma2agGrid;
