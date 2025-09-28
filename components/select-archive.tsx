import { Archive } from "@/generated/prisma/inspector-client";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Key } from "react";

interface SelectArchiveProps {
  archives: Archive[];
  value?: string;
  onChange: (key: Key | null) => void;
  withoutTitle?: boolean;
  className?: string;
}

const SelectArchive: React.FC<SelectArchiveProps> = ({ archives, value, onChange, withoutTitle, className }) => {
  return (
    <Autocomplete
      label="Архів"
      isClearable={false}
      selectedKey={value}
      onSelectionChange={onChange}
      className={className}
    >
      {archives.map((archive) => (
        <AutocompleteItem key={archive.id} textValue={archive.code}>
          <div>
            <p>{archive.code}</p>
            {!withoutTitle && <p className="opacity-70 text-sm text-wrap">{archive.title}</p>}
          </div>
        </AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

export default SelectArchive;
