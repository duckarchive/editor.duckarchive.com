"use client";

import {
  ModalContent,
  Modal,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/modal";
import { useEffect, useState } from "react";

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

  return (
    <>
      {/* <Button
        className="mb-4"
        color="primary"
        isDisabled={items.length === 0}
        startContent={<IoSettings className="w-4 h-4" />}
        variant="bordered"
        onPress={onOpen}
      >
        Масове редагування ({items.length})
      </Button> */}

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
              // <InspectorPanelForm
              //   defaultValues={activeItem}
              //   isLoading={isLoading}
              //   onCancel={handleCloseModal}
              //   onSubmit={handleFormSubmit}
              // />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default InspectorPanel;
