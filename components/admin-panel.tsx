"use client";

import { Button } from "@heroui/button";
import {
  ModalContent,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { IoSettings, IoTrash, IoCreate } from "react-icons/io5";

interface AdminPanelProps {
  items: Array<BaseInstance>;
  activeItem?: BaseInstance;
  onClose?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  items,
  activeItem,
  onClose: onCloseProp,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure({
    isOpen: !!activeItem,
  });

  const handleCloseModal = () => {
    onCloseProp?.();
    onClose();
  };

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
        Manage Selected ({items.length})
      </Button>

      <Modal
        backdrop="blur"
        isOpen={isOpen}
        size="2xl"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Selected Items</h3>
            <p className="text-sm text-gray-500">
              {items.length} item{items.length !== 1 ? "s" : ""} selected
            </p>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Item IDs:</h4>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {activeItem && (
                    <Chip
                      key={activeItem.id}
                      className="font-mono"
                      color="primary"
                    >
                      {activeItem.id}
                    </Chip>
                  )}
                  {items.map((item, index) => (
                    <Chip
                      key={index}
                      className="font-mono"
                      color="primary"
                      size="sm"
                      variant="flat"
                    >
                      {item.id}
                    </Chip>
                  ))}
                </div>
              </div>

              {items.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    You can perform bulk operations on these selected items.
                  </p>
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter className="gap-2">
            <Button
              color="danger"
              isDisabled={items.length === 0}
              startContent={<IoTrash className="w-4 h-4" />}
              variant="light"
            >
              Delete Selected
            </Button>
            <Button
              color="primary"
              isDisabled={items.length === 0}
              startContent={<IoCreate className="w-4 h-4" />}
              variant="light"
            >
              Bulk Edit
            </Button>
            <Button color="primary" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AdminPanel;
