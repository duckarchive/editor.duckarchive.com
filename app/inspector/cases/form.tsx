import SelectArchive from "@/components/select-archive";
import { Archive, Author, Prisma } from "@/generated/prisma/inspector-client";
import { Input } from "@heroui/input";
import { Key, useState } from "react";

export type FullCase = Prisma.CaseGetPayload<{
  include: {
    description: {
      include: {
        fund: true;
      };
    };
    authors: {
      include: {
        author: true;
      };
    };
    locations: true;
    years: true;
  };
}>;

interface InspectorCaseFormProps {
  authors: Author[];
  archives: Archive[];
  defaultValues?: BaseInstance;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const InspectorCaseForm: React.FC<InspectorCaseFormProps> = ({
  authors,
  archives,
  defaultValues,
  isLoading,
  onCancel,
  onSubmit,
}) => {
  const [formValues, setFormValues] = useState<FullCase | undefined>(
    defaultValues as FullCase
  );
  const handleArchiveChange = (value: Key | null) => {
    setFormValues((prev) => {
      if (!prev || !value) return prev;
      return {
        ...prev,
        description: {
          ...prev.description,
          fund: {
            ...prev.description.fund,
            archive_id: value.toString(),
          },
        },
      };
    });
  };

  console.log(formValues?.description.fund.archive_id);

  return (
    <form onSubmit={onSubmit}>
      <fieldset title="Реквізити" className="flex gap-2">
        <SelectArchive
          archives={archives}
          value={formValues?.description.fund.archive_id}
          onChange={handleArchiveChange}
        />
        {/* <Input
          label="Фонд"
          value={searchValues.fund || ""}
          onChange={handleInputChange("fund")}
        />
        <Input
          label="Опис"
          value={searchValues.description || ""}
          onChange={handleInputChange("description")}
        />
        <Input
          label="Справа"
          value={searchValues.case || ""}
          onChange={handleInputChange("case")}
        /> */}
      </fieldset>
    </form>
  );
};

export default InspectorCaseForm;
