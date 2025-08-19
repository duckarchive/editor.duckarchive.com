"use client";

import { Button } from "@heroui/button";
import {
  ModalContent,
  Modal,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/modal";
import { IoSettings } from "react-icons/io5";
import { useEffect, useState } from "react";

import AdminPanelForm from "./admin-panel-form";

interface AdminPanelProps {
  items: Array<BaseInstance>;
  activeItem?: BaseInstance;
  onClose?: () => void;
  onSave?: (values: BaseInstance) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  items,
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
      await onSave?.(values);
      handleCloseModal();
    } catch {
      // Handle error silently or show notification
    } finally {
      setIsLoading(false);
    }
  };

  // Get default values from active item or first selected item
  const defaultValues =
    activeItem || (items.length > 0 ? items[0] : { id: "" });

  return (
    <>
      <Button
        className="mb-4"
        color="primary"
        isDisabled={items.length === 0}
        startContent={<IoSettings className="w-4 h-4" />}
        variant="bordered"
        onPress={onOpen}
      >
        Масове редагування ({items.length})
      </Button>

      <Modal
        backdrop="blur"
        isOpen={isOpen}
        scrollBehavior="inside"
        size="4xl"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">
              {activeItem
                ? `Редагування запису`
                : `Масове редагування (${items.length} записів)`}
            </h3>
          </ModalHeader>

          <ModalBody>
            <AdminPanelForm
              defaultValues={defaultValues}
              isLoading={isLoading}
              onCancel={handleCloseModal}
              onSubmit={handleFormSubmit}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AdminPanel;
