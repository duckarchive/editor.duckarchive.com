"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import CoordinatesInput from "@/components/coordinates-input";
import { useEffect, useState } from "react";
import { Author } from "@/generated/prisma/inspector-client";
import TagInput from "@/components/tag-input";

interface AuthorMergeFormProps {
  authors: Author[];
  onSubmit: (data: Author) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const AuthorMergeForm: React.FC<AuthorMergeFormProps> = ({
  authors,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formDataValues, setFormDataValues] = useState<Author>(authors[0]);

  useEffect(() => {
    // fill values with existing values from all authors
    const combinedTags = Array.from(
      new Set(authors.flatMap((a) => a.tags || []))
    );

    setFormDataValues({
      id: authors[0].id,
      title: authors.find((a) => a.title)?.title || "",
      info: authors.find((a) => a.info)?.info || "",
      lat: authors.find((a) => a.lat)?.lat || null,
      lng: authors.find((a) => a.lng)?.lng || null,
      tags: combinedTags,
    });
  }, [authors]);

  const handleInputChange = (field: keyof Author, value: any) => {
    setFormDataValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCoordinatesChange = (coords: { lat?: string; lng?: string }) => {
    setFormDataValues((prev) => ({
      ...prev,
      lat: coords.lat ? parseFloat(coords.lat) : null,
      lng: coords.lng ? parseFloat(coords.lng) : null,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formDataValues);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <ol className="text-sm text-gray-600 list-decimal list-inside">
          {authors.map((a) => (
            <li key={a.id}>{a.title}</li>
          ))}
        </ol>
        <Input
          label="Назва автора"
          placeholder="Введіть назву автора"
          value={formDataValues.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          isRequired
          isDisabled={isLoading}
        />

        <ol className="text-sm text-gray-600 list-decimal list-inside">
          {authors.map((a) => (
            <li key={a.id}>{a.info}</li>
          ))}
        </ol>
        <Input
          label="Опис"
          placeholder="Додаткова інформація про автора"
          value={formDataValues.info || ""}
          onChange={(e) => handleInputChange("info", e.target.value)}
          isDisabled={isLoading}
        />

        <TagInput
          values={formDataValues.tags || []}
          onChange={(tags) => handleInputChange("tags", tags)}
          isDisabled={isLoading}
        />

        <div>
          <CoordinatesInput
            value={{
              lat: formDataValues.lat?.toString(),
              lng: formDataValues.lng?.toString(),
            }}
            onChange={handleCoordinatesChange}
            isLoading={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="bordered"
            onPress={onCancel}
            isDisabled={isLoading}
          >
            Скасувати
          </Button>
        )}
        <Button
          type="submit"
          color="primary"
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          Об'єднати авторів
        </Button>
      </div>
    </form>
  );
};

export default AuthorMergeForm;