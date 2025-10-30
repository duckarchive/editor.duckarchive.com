import ParentalStructureInput from "@/components/parental-structure-input";
import { Archive, Author, Prisma } from "@/generated/prisma/inspector-client";
import { Input } from "@heroui/input";
import { Key, useState } from "react";

export type FullCase = Prisma.CaseGetPayload<{
  include: {
    description: {
      include: {
        fund: {
          include: {
            archive: true;
          };
        };
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
  
  // For create mode (no defaultValues), track structure codes separately
  const [structureCodes, setStructureCodes] = useState({
    archive_code: "",
    fund_code: "",
    description_code: "",
    case_code: "",
  });
  
  const isCreateMode = !defaultValues;
  const handleStructureChange = (field: string, value: string) => {
    if (isCreateMode) {
      // In create mode, just update the structure codes
      setStructureCodes(prev => ({
        ...prev,
        [field]: value,
      }));
    } else {
      // In edit mode, update the form values as before
      setFormValues((prev) => {
        if (!prev) return prev;
        
        switch (field) {
          case "archive_code":
            return {
              ...prev,
              description: {
                ...prev.description,
                fund: {
                  ...prev.description.fund,
                  archive: {
                    ...prev.description.fund.archive,
                    code: value,
                  },
                },
              },
            };
          case "fund_code":
            return {
              ...prev,
              description: {
                ...prev.description,
                fund: {
                  ...prev.description.fund,
                  code: value,
                },
              },
            };
          case "description_code":
            return {
              ...prev,
              description: {
                ...prev.description,
                code: value,
              },
            };
          case "case_code":
            return {
              ...prev,
              code: value,
            };
          default:
            return prev;
        }
      });
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <ParentalStructureInput
        archives={archives}
        deps={4}
        original_ids={isCreateMode ? undefined : {
          archive_id: formValues?.description.fund.archive.id,
          fund_id: formValues?.description.fund.id,
          description_id: formValues?.description.id,
          case_id: formValues?.id,
        }}
        values={isCreateMode ? structureCodes : {
          archive_code: formValues?.description.fund.archive.code,
          fund_code: formValues?.description.fund.code,
          description_code: formValues?.description.code,
          case_code: formValues?.code,
        }}
        onChange={handleStructureChange}
      />
    </form>
  );
};

export default InspectorCaseForm;
