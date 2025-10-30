"use client";

import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { useState } from "react";
import { IoRepeat } from "react-icons/io5";

interface FindAndReplaceProps {
  onReplace: (find: string, replace: string) => void;
  isDisabled?: boolean;
}

const FindAndReplace: React.FC<FindAndReplaceProps> = ({
  onReplace,
  isDisabled,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");

  const handleReplace = () => {
    onReplace(findValue, replaceValue);
    onClose();
  };

  return (
    <>
      <Button
        isIconOnly
        aria-label="Find and replace"
        variant="ghost"
        onPress={onOpen}
        isDisabled={isDisabled}
      >
        <IoRepeat size={20} />
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Знайти та замінити</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Знайти"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
              />
              <Input
                label="Замінити на"
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onPress={onClose}>
              Скасувати
            </Button>
            <Button color="primary" onPress={handleReplace}>
              Замінити
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FindAndReplace;
