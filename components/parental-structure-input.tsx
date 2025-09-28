import SelectArchive from "@/components/select-archive";
import { Archive } from "@/generated/prisma/inspector-client";
import { Input } from "@heroui/input";
import { Key } from "react";

interface ParentalStructureInputProps {
  archives: Archive[];
  deps?: number;
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
  values,
  onChange,
}) => {
  const handleArchiveChange = (key: Key | null) => {
    if (onChange && key) {
      onChange("archive_id", key.toString());
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(field, e.target.value);
    }
  };

  return (
    <div className="flex gap-2">
      {deps >= 1 && (
        <SelectArchive
          archives={archives}
          value={values?.archive_code}
          onChange={handleArchiveChange}
        />
      )}
      {deps >= 2 && (
        <Input
          label="Фонд"
          value={values?.fund_code || ""}
          onChange={handleInputChange("fund_code")}
        />
      )}
      {deps >= 3 && (
        <Input
          label="Опис"
          value={values?.description_code || ""}
          onChange={handleInputChange("description_code")}
        />
      )}
      {deps >= 4 && (
        <Input
          label="Справа"
          value={values?.case_code || ""}
          onChange={handleInputChange("case_code")}
        />
      )}
    </div>
  );
};

export default ParentalStructureInput;