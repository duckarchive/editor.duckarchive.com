"use client";

import {
  ModalContent,
  Modal,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { useEffect, useState } from "react";
import { IoAdd } from "react-icons/io5";

import InspectorPanelForm from "./inspector-panel-form";
import InspectorCaseForm from "@/app/inspector/cases/form";
import { Archive, Author } from "@/generated/prisma/inspector-client";

interface InspectorPanelProps {
  archives: Archive[];
  authors: Author[];
  // items: Array<BaseInstance>;
  activeItem?: BaseInstance;
  onClose?: () => void;
  onSave?: (values: BaseInstance) => void;
}

const InspectorPanel: React.FC<InspectorPanelProps> = ({
  archives,
  authors,
  activeItem,
  onClose: onCloseProp,
  onSave,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isCreateOpen, 
    onOpen: onCreateOpen, 
    onClose: onCreateClose 
  } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeItem) {
      onOpen();
    }
  }, [activeItem, onOpen]);

  const handleCloseModal = () => {
    onCloseProp?.();
    onClose();
  };

  const handleFormSubmit = async (values: BaseInstance) => {
    setIsLoading(true);
    try {
      onSave?.(values);
      handleCloseModal();
    } catch {
      // Handle error silently or show notification
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Here you would typically call an API to create the new item
      // For now, just close the modal
      onCreateClose();
    } catch {
      // Handle error silently or show notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="w-1/4"
        color="primary"
        startContent={<IoAdd className="w-4 h-4" />}
        variant="solid"
        onPress={onCreateOpen}
      >
        Створити новий запис
      </Button>

      {/* Edit Modal */}
      <Modal
        backdrop="blur"
        isOpen={isOpen && Boolean(activeItem)}
        scrollBehavior="inside"
        size="full"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Редагування запису</h3>
          </ModalHeader>

          <ModalBody>
            {activeItem && (
              <InspectorCaseForm
                archives={archives}
                authors={authors}
                defaultValues={activeItem}
                isLoading={isLoading}
                onCancel={handleCloseModal}
                onSubmit={() => {}}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Create Modal */}
      <Modal
        backdrop="blur"
        isOpen={isCreateOpen}
        scrollBehavior="inside"
        size="full"
        onClose={onCreateClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Створення нового запису</h3>
          </ModalHeader>

          <ModalBody>
            <InspectorCaseForm
              archives={archives}
              authors={authors}
              isLoading={isLoading}
              onCancel={onCreateClose}
              onSubmit={handleCreateSubmit}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default InspectorPanel;
