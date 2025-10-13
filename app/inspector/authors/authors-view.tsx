"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/modal";
import InspectorView from "@/components/inspector-view";
import { Author } from "@/generated/prisma/inspector-client";
import AuthorMergeForm from "@/app/inspector/authors/author-merge-form";
import { ColDef } from "ag-grid-community";
import { BaseInstance } from "@/types";
import { useGet, usePost } from "@/hooks/useApi";

interface AuthorsViewProps {
  columns: ColDef[];
  archives: any[];
}

const AuthorsView: React.FC<AuthorsViewProps> = ({
  columns,
  archives,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAuthors, setSelectedAuthors] = useState<Author[]>([]);
  const { data: authors, mutate } = useGet<Author[]>("/api/inspector/authors");
  const { trigger: mergeAuthors, isMutating: isMerging } = usePost<
    Author,
    { target: Author; toDelete: string[] }
  >("/api/inspector/authors/merge");

  const handleSelectionChange = (items: BaseInstance[]) => {
    setSelectedAuthors(items as Author[]);
  };

  const handleMerge = () => {
    onOpen();
  };

  const handleMergeSubmit = async (data: Author) => {
    const toDelete = selectedAuthors
      .map((a) => a.id)
      .filter((id) => id !== data.id);

    await mergeAuthors({ target: data, toDelete });
    mutate(); // Re-fetch authors
    setSelectedAuthors([]);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Автори</h1>
        <div className="flex gap-2">
          {selectedAuthors.length > 1 && (
            <Button color="primary" onPress={handleMerge}>
              Об'єднати ({selectedAuthors.length})
            </Button>
          )}
        </div>
      </div>
      <InspectorView
        prefix="inspector/authors"
        columns={columns}
        archives={archives}
        authors={authors || []}
        onSelectionChanged={handleSelectionChange}
      />
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          <ModalHeader>Об'єднання авторів</ModalHeader>
          <ModalBody>
            <AuthorMergeForm
              authors={selectedAuthors}
              onSubmit={handleMergeSubmit}
              onCancel={onClose}
              isLoading={isMerging}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AuthorsView;