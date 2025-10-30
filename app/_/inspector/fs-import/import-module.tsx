"use client";

import { FSItemsFreshResponse } from "@/app/api/inspector/fs-import/route";
import { autoParseFSItem } from "@/app/inspector/fs-import/parse";
import { useGet, usePost } from "@/hooks/useApi";
import { DuckTable } from "@duckarchive/framework";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { SelectionChangedEvent } from "ag-grid-community";
import { useState } from "react";

type TableItem = FSItemsFreshResponse[number];

interface CheckStats {
  funds: {
    create: string[];
    update: string[];
  };
  descriptions: {
    create: string[];
    update: string[];
  };
  cases: {
    create: string[];
    update: string[];
  };
}

const renderParseResultCell = ({ data }: { data: TableItem }) => {
  const parsed = autoParseFSItem(data);
  return (
    <>
      {parsed.map((item) => (
        <p key={`${data.dgs}-${item}`}>{item}</p>
      ))}
    </>
  );
};

const ImportModule: React.FC = () => {
  const { data, mutate } = useGet<FSItemsFreshResponse>(
    "/api/inspector/fs-import"
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedItems, setSelectedItems] = useState<TableItem[]>([]);
  const {
    trigger: checkItems,
    data: checkStats,
    isMutating: isChecking,
  } = usePost<CheckStats, any>("/api/inspector/fs-import/check");
  const { trigger: importItems, isMutating: isImporting } = usePost<any, any>(
    "/api/inspector/fs-import"
  );

  const handleSelectionChange = (
    event: SelectionChangedEvent<TableItem, any>
  ) => {
    setSelectedItems(event.api.getSelectedRows());
  };

  const handleCheck = async () => {
    const payload = selectedItems.map((item) => ({
      ...item,
      fullCode: autoParseFSItem(item)[0] || "",
    }));
    await checkItems(payload);
    onOpen();
  };

  const handleImport = async () => {
    const payload = selectedItems.map((item) => ({
      ...item,
      fullCode: autoParseFSItem(item)[0] || "",
    }));
    await importItems(payload);
    onClose();
    mutate();
  };

  return (
    <div className="h-[90vh] flex flex-col">
      <div className="p-2 flex justify-end">
        {selectedItems.length > 0 && (
          <Button color="primary" onPress={handleCheck} isLoading={isChecking}>
            Перевірити ({selectedItems.length})
          </Button>
        )}
      </div>
      <DuckTable<TableItem>
        rowSelection={{ mode: "multiRow", selectAll: "filtered" }}
        onSelectionChanged={handleSelectionChange}
        columns={[
          {
            field: "dgs",
            headerName: "DGS",
            width: 120,
            cellRenderer: ({ value }: { value: string }) => (
              <Link
                isExternal
                href={`https://www.familysearch.org/en/records/images/search-results?imageGroupNumbers=${value}`}
                className="text-sm underline"
              >
                {value}
              </Link>
            ),
          },
          {
            field: "project_id",
            headerName: "Project ID",
            width: 140,
            cellRenderer: ({ value }: { value: string }) => (
              <Link
                isExternal
                href={`https://www.familysearch.org/en/records/images/search-results?projectId=${value}`}
                className="text-sm underline"
              >
                {value}
              </Link>
            ),
          },
          // {
          //   field: "volume",
          //   flex: 1,
          // },
          {
            field: "volumes",
            flex: 1,
          },
          // {
          //   field: "title",
          // },
          {
            colId: "parsed",
            headerName: "Розпізнано",
            cellRenderer: renderParseResultCell,
            valueGetter: (params) => autoParseFSItem(params.data).join(", "),
            pinned: "right",
            width: 200,
            resizable: false,
          },
        ]}
        rows={data || []}
        setActiveFilterId={() => {}}
        defaultColDef={{
          wrapText: true,
          autoHeight: true,
        }}
      />
      {checkStats && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Результати перевірки</ModalHeader>
            <ModalBody>
              <div className="space-y-4 overflow-y-auto max-h-96">
                <div>
                  <h3 className="font-semibold">Фонди</h3>
                  <p>Створити: {checkStats.funds.create.join(", ")}</p>
                  <p>Оновити: {checkStats.funds.update.join(", ")}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Описи</h3>
                  <p>Створити: {checkStats.descriptions.create.join(", ")}</p>
                  <p>Оновити: {checkStats.descriptions.update.join(", ")}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Справи</h3>
                  <p>Створити: {checkStats.cases.create.join(", ")}</p>
                  <p>Оновити: {checkStats.cases.update.join(", ")}</p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button onPress={onClose} color="secondary">
                Скасувати
              </Button>
              <Button
                onPress={handleImport}
                isLoading={isImporting}
                color="primary"
              >
                Підтвердити
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default ImportModule;
