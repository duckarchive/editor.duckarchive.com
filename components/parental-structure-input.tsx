import SelectArchive from "@/components/select-archive";
import { Archive } from "@/generated/prisma/inspector-client";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Key, useState, useEffect } from "react";
import {
  StructureCheckResponse,
  StructureCheckRequest,
} from "@/app/api/inspector/structure/check/route";
import {
  StructureApplyRequest,
  StructureApplyResponse,
} from "@/app/api/inspector/structure/route";
import { usePost, usePut } from "@/hooks/useApi";
import { IoHammer, IoPencil } from "react-icons/io5";
import { Link } from "@heroui/link";

const DELIMITER = "/";

interface ParentalStructureInputProps {
  archives: Archive[];
  deps?: number;
  original_ids?: {
    archive_id?: string;
    fund_id?: string;
    description_id?: string;
    case_id?: string;
  };
  values?: {
    archive_code?: string;
    fund_code?: string;
    description_code?: string;
    case_code?: string;
  };
  onChange?: (field: string, value: string) => void;
}

const ParentalStructureInput: React.FC<ParentalStructureInputProps> = ({
  archives,
  deps = 4,
  original_ids,
  values,
  onChange,
}) => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [formValues, setFormValues] = useState({
    archive_code: values?.archive_code || "",
    fund_code: values?.fund_code || "",
    description_code: values?.description_code || "",
    case_code: values?.case_code || "",
  });

  const [checkResult, setCheckResult] = useState<StructureCheckResponse | null>(
    null
  );
  const [isChecked, setIsChecked] = useState(false);

  // SWR mutations
  const { trigger: triggerCheck, isMutating: isChecking } = usePost<
    StructureCheckResponse,
    StructureCheckRequest
  >("/api/inspector/structure/check");

  const { trigger: triggerCreate, isMutating: isCreating } = usePost<
    StructureApplyResponse,
    StructureApplyRequest
  >("/api/inspector/structure");

  const { trigger: triggerUpdate, isMutating: isUpdating } = usePut<
    StructureApplyResponse,
    StructureApplyRequest
  >("/api/inspector/structure");

  // Determine if this is create mode (no original_ids provided)
  const isCreateMode = !original_ids || Object.values(original_ids).every(id => !id);
  const isSubmitting = isCreateMode ? isCreating : isUpdating;

  const generateDisplayString = () => {
    const parts = [];
    if (deps >= 1 && formValues.archive_code)
      parts.push(formValues.archive_code);
    if (deps >= 2 && formValues.fund_code) parts.push(formValues.fund_code);
    if (deps >= 3 && formValues.description_code)
      parts.push(formValues.description_code);
    if (deps >= 4 && formValues.case_code) parts.push(formValues.case_code);
    return parts.length > 0 ? parts.join(DELIMITER) : "Не заповнено";
  };

  const handleArchiveChange = (key: Key | null) => {
    const value = key ? key.toString() : "";
    const archive = archives.find((a) => a.code === value);
    const archiveCode = archive?.code || "";

    setFormValues((prev) => ({ ...prev, archive_code: archiveCode }));
    setIsChecked(false); // Reset check state when values change
    setCheckResult(null);
  };

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
      setIsChecked(false); // Reset check state when values change
      setCheckResult(null);
    };

  const handleCheck = async () => {
    try {
      const result = await triggerCheck({
        original: original_ids || {},
        new: formValues,
      });

      setCheckResult(result);
      setIsChecked(true);
    } catch (error) {
      console.error("Check error:", error);
      setCheckResult({
        valid: false,
        diff_items: [],
        errors: ["Помилка перевірки структури"],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isChecked) {
      await handleCheck();
      return;
    }

    try {
      const triggerApply = isCreateMode ? triggerCreate : triggerUpdate;
      const result = await triggerApply(formValues);

      if (result.success) {
        console.log(`Structure ${isCreateMode ? 'created' : 'updated'} successfully:`, result.applied);

        // Call onChange for each field if provided
        if (onChange) {
          Object.entries(result.applied).forEach(([field, value]) => {
            if (field === "archive_code") {
              const archive = archives.find((a) => a.code === value);
              if (archive) {
                onChange("archive_id", archive.id);
              }
            } else {
              onChange(field, value as string);
            }
          });
        }

        onOpenChange();
      } else {
        console.error(`Structure ${isCreateMode ? 'create' : 'update'} failed:`, result.error);
      }
    } catch (error) {
      console.error(`${isCreateMode ? 'Create' : 'Update'} error:`, error);
    }
  };

  const handleCancel = () => {
    // Reset form values to original prop values
    setFormValues({
      archive_code: values?.archive_code || "",
      fund_code: values?.fund_code || "",
      description_code: values?.description_code || "",
      case_code: values?.case_code || "",
    });
    // Reset check state
    setIsChecked(false);
    setCheckResult(null);
    // Close modal
    onClose();
  };

  // Update form values when props change
  useEffect(() => {
    setFormValues({
      archive_code: values?.archive_code || "",
      fund_code: values?.fund_code || "",
      description_code: values?.description_code || "",
      case_code: values?.case_code || "",
    });
    // Reset check state when props change
    setIsChecked(false);
    setCheckResult(null);
  }, [values]);

  return (
    <>
      <div className="flex items-center gap-1">
        <span className="text-gray-700 text-4xl">
          {generateDisplayString()}
        </span>
        <Button isIconOnly variant="light" onPress={onOpen}>
          <IoHammer className="text-lg" />
        </Button>
      </div>

      <Modal isOpen={isOpen} size="2xl" backdrop="blur" hideCloseButton>
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              Редагування реквізитів
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-2">
                {/* Display check results */}
                {checkResult && (
                  <div className="p-3 rounded-lg border">
                    {checkResult.errors && checkResult.errors.length > 0 && (
                      <div className="mb-2">
                        <p className="font-semibold text-red-600">Помилки:</p>
                        <ul className="text-red-600 text-sm list-disc list-inside">
                          {checkResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Display diff items */}
                    {checkResult.diff_items &&
                      checkResult.diff_items.length > 0 && (
                        <div className="mb-2">
                          <p className="font-semibold">
                            Зміни структури:
                          </p>
                          <div className="space-y-2 mt-2">
                            {checkResult.diff_items.map((item, index) => (
                              <div
                                key={index}
                                className="p-2 rounded border-l-4 border-green-400 bg-green-50"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-800">
                                    Створити
                                  </span>
                                  <span className="text-xs text-gray-500 uppercase">
                                    {item.entity}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-800">
                                  {item.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {checkResult.valid &&
                      checkResult.diff_items.length === 0 && (
                        <p className="text-green-600 font-semibold">
                          ✓ Немає змін структури
                        </p>
                      )}
                  </div>
                )}

                {deps >= 1 && (
                  <SelectArchive
                    archives={archives}
                    value={formValues.archive_code}
                    onChange={handleArchiveChange}
                  />
                )}
                <div className="flex items-center gap-2">
                  {deps >= 2 && (
                    <Input
                      label="Фонд"
                      value={formValues.fund_code}
                      onChange={handleInputChange("fund_code")}
                    />
                  )}
                  {deps >= 3 && (
                    <Input
                      label="Опис"
                      value={formValues.description_code}
                      onChange={handleInputChange("description_code")}
                    />
                  )}
                  {deps >= 4 && (
                    <Input
                      label="Справа"
                      value={formValues.case_code}
                      onChange={handleInputChange("case_code")}
                    />
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleCancel}>
                Скасувати
              </Button>
              {!isChecked && (
                <Button
                  color="primary"
                  onPress={handleCheck}
                  isLoading={isChecking}
                  variant="bordered"
                >
                  {isChecking ? "Перевірка..." : "Перевірити"}
                </Button>
              )}
              {isChecked && checkResult?.valid && (
                <Button color="success" type="submit" isLoading={isSubmitting}>
                  {isSubmitting 
                    ? (isCreateMode ? "Створення..." : "Оновлення...") 
                    : (isCreateMode ? "Створити" : "Оновити")
                  }
                </Button>
              )}
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ParentalStructureInput;
