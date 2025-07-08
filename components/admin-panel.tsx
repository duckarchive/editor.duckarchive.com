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
  items: Array<{ id: string | number }>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ items }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button
        onPress={onOpen}
        color="primary"
        variant="bordered"
        startContent={<IoSettings className="w-4 h-4" />}
        isDisabled={items.length === 0}
        className="mb-4"
      >
        Manage Selected ({items.length})
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
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
                  {items.map((item, index) => (
                    <Chip
                      key={index}
                      variant="flat"
                      color="primary"
                      size="sm"
                      className="font-mono"
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
              variant="light"
              startContent={<IoTrash className="w-4 h-4" />}
              isDisabled={items.length === 0}
            >
              Delete Selected
            </Button>
            <Button
              color="primary"
              variant="light"
              startContent={<IoCreate className="w-4 h-4" />}
              isDisabled={items.length === 0}
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
