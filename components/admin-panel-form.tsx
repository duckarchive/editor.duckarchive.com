"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";

import MapField from "@/components/MapField";
import { HIDDEN_FIELDS, READONLY_FIELDS } from "@/lib/fields";

interface FormValues extends BaseInstance {
  [key: string]: any;
  lat?: number | null;
  lng?: number | null;
}

interface AdminPanelFormProps {
  defaultValues: FormValues;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FieldConfig {
  key: string;
  type:
    | "text"
    | "number"
    | "email"
    | "password"
    | "textarea"
    | "select"
    | "boolean"
    | "date"
    | "datetime-local"
    | "coordinates";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ key: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
}

const getFieldType = (key: string, value: any): FieldConfig["type"] => {
  // Special handling for coordinates
  if (key === "lat" || key === "lng") {
    return "coordinates";
  }

  // Type detection based on value
  if (typeof value === "boolean") {
    return "boolean";
  }

  if (typeof value === "number") {
    return "number";
  }

  if (typeof value === "string") {
    // Check for email pattern
    if (
      key.toLowerCase().includes("email") ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      return "email";
    }

    // Check for password fields
    if (
      key.toLowerCase().includes("password") ||
      key.toLowerCase().includes("pass")
    ) {
      return "password";
    }

    // Check for date patterns
    if (
      key.toLowerCase().includes("date") ||
      key.toLowerCase().includes("created") ||
      key.toLowerCase().includes("updated")
    ) {
      if (value.includes("T")) {
        return "datetime-local";
      }

      return "date";
    }

    // Check for long text (textarea)
    if (
      value.length > 100 ||
      key.toLowerCase().includes("description") ||
      key.toLowerCase().includes("content") ||
      key.toLowerCase().includes("text")
    ) {
      return "textarea";
    }

    return "text";
  }

  return "text";
};

const getFieldLabel = (key: string): string => {
  // Convert camelCase or snake_case to readable labels
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
};

const AdminPanelForm: React.FC<AdminPanelFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formValues, setFormValues] = useState<FormValues>(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormValues(defaultValues);
  }, [defaultValues]);

  // Generate field configurations based on defaultValues
  const fieldConfigs: FieldConfig[] = Object.entries(defaultValues)
    .filter(
      ([key]) => !HIDDEN_FIELDS.includes(key) && !READONLY_FIELDS.includes(key),
    ) // Exclude ID field from editing
    .map(([key, value]) => ({
      key,
      type: getFieldType(key, value),
      label: getFieldLabel(key),
      required: false, // You can add logic here to determine required fields
    }));

  // Group coordinates fields
  const coordinateFields = fieldConfigs.filter(
    (field) => field.type === "coordinates",
  );
  const otherFields = fieldConfigs.filter(
    (field) => field.type !== "coordinates",
  );

  const handleInputChange = (key: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fieldConfigs.forEach((field) => {
      if (
        field.required &&
        (!formValues[field.key] || formValues[field.key] === "")
      ) {
        newErrors[field.key] = `${field.label} є обов'язковим полем`;
      }

      // Email validation
      if (field.type === "email" && formValues[field.key]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(formValues[field.key])) {
          newErrors[field.key] = "Неправильний формат email";
        }
      }

      // Number validation
      if (field.type === "number" && formValues[field.key] !== undefined) {
        const numValue = Number(formValues[field.key]);

        if (isNaN(numValue)) {
          newErrors[field.key] = "Значення повинно бути числом";
        } else {
          if (field.min !== undefined && numValue < field.min) {
            newErrors[field.key] =
              `Значення повинно бути не менше ${field.min}`;
          }
          if (field.max !== undefined && numValue > field.max) {
            newErrors[field.key] =
              `Значення повинно бути не більше ${field.max}`;
          }
        }
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = formValues[field.key];
    const isInvalid = !!errors[field.key];
    const errorMessage = errors[field.key];

    switch (field.type) {
      case "boolean":
        return (
          <Switch
            key={field.key}
            isSelected={!!value}
            onValueChange={(checked) => handleInputChange(field.key, checked)}
          >
            {field.label}
          </Switch>
        );

      case "textarea":
        return (
          <Input
            key={field.key}
            errorMessage={errorMessage}
            isInvalid={isInvalid}
            isRequired={field.required}
            label={field.label}
            placeholder={field.placeholder}
            value={value || ""}
            onValueChange={(val) => handleInputChange(field.key, val)}
          />
        );

      case "select":
        return (
          <Select
            key={field.key}
            errorMessage={errorMessage}
            isInvalid={isInvalid}
            isRequired={field.required}
            label={field.label}
            placeholder={
              field.placeholder || `Оберіть ${field.label.toLowerCase()}`
            }
            selectedKeys={value ? [value] : []}
            onSelectionChange={(keys: any) => {
              const selectedKey = Array.from(keys)[0];

              handleInputChange(field.key, selectedKey);
            }}
          >
            {(field.options || []).map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
        );

      default:
        return (
          <Input
            key={field.key}
            errorMessage={errorMessage}
            isInvalid={isInvalid}
            isRequired={field.required}
            label={field.label}
            max={field.max}
            min={field.min}
            placeholder={field.placeholder}
            step={field.step}
            type={field.type}
            value={value?.toString() || ""}
            onValueChange={(val) => {
              const processedValue =
                field.type === "number"
                  ? val === ""
                    ? undefined
                    : Number(val)
                  : val;

              handleInputChange(field.key, processedValue);
            }}
          />
        );
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Other fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {otherFields.map(renderField)}
      </div>
      {/* Coordinate fields grouped together */}
      {coordinateFields.length >= 2 && (
        <div className="space-y-2">
          <MapField
            errorMessage={errors.lat || errors.lng}
            isInvalid={!!(errors.lat || errors.lng)}
            isRequired={coordinateFields.some((f) => f.required)}
            lat={formValues.lat || undefined}
            lng={formValues.lng || undefined}
            onLatChange={(lat) => handleInputChange("lat", lat)}
            onLngChange={(lng) => handleInputChange("lng", lng)}
          />
          {coordinateFields.length > 2 && <Divider />}
        </div>
      )}

      {/* Form actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button color="default" variant="bordered" onPress={onCancel}>
          Скасувати
        </Button>
        <Button color="primary" isLoading={isLoading} type="submit">
          Зберегти
        </Button>
      </div>
    </form>
  );
};

export default AdminPanelForm;
