import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { useState } from "react";

interface TagInputProps {
  values: string[];
  onChange: (tags: string[]) => void;
  isDisabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
  values,
  onChange,
  isDisabled = false,
}) => {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    onChange([...values, tagInput.trim()]);
    setTagInput("");
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(values.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Теги</label>
      <div className="flex gap-2">
        <Input
          placeholder="Додати тег"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={handleKeyPress}
          isDisabled={isDisabled}
        />
        <Button
          type="button"
          onPress={handleAddTag}
          isDisabled={!tagInput.trim() || isDisabled}
          variant="bordered"
        >
          Додати
        </Button>
      </div>
      {values && values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {values.map((tag) => (
            <Chip
              key={tag}
              onClose={() => handleRemoveTag(tag)}
              variant="flat"
              size="sm"
            >
              {tag}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;
