"use client";

import * as React from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";

export type FieldType =
  | React.InputHTMLAttributes<HTMLInputElement>["type"]
  | "multiline";

export type DynamicTextFieldProps = Omit<TextFieldProps, "type" | "variant" | "name"> & {
  id: string;
  fieldType?: FieldType;
  variant?: TextFieldProps["variant"];
  name?: string;
  readOnly?: boolean;
  rowsWhenMultiline?: number;
};

export default function DynamicTextField({
  id,
  name,
  label,
  fieldType = "text",
  variant = "outlined",
  readOnly,
  rowsWhenMultiline = 3,
  ...rest
}: DynamicTextFieldProps) {
  const isMultiline = fieldType === "multiline";

  return (
    <TextField
      id={id}
      name={name ?? id}
      label={label}
      variant={variant}
      type={isMultiline ? undefined : fieldType}
      multiline={isMultiline}
      rows={isMultiline ? rowsWhenMultiline : undefined}
      slotProps={{
        input: {
          readOnly,
          ...(rest.slotProps as any)?.input,
        },
        ...rest.slotProps,
      }}
      {...rest}
    />
  );
}
