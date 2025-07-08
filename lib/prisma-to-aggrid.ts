import { ColDef } from "ag-grid-community";

import catalog from "@/generated/prisma/catalog-client/runtime/library";
import duckarchive from "@/generated/prisma/duckarchive-client/runtime/library";
import duckkey from "@/generated/prisma/duckkey-client/runtime/library";
import inspector from "@/generated/prisma/inspector-client/runtime/library";

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
    if (!field.relationName) {
      columns.push({
        field: field.name,
        headerName: field.name,
        sortable: true,
        filter: true,
        resizable: true,
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

  return columnsHashTable;
};

export default prisma2agGrid;
