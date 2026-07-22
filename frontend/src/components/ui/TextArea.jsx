// src/components/ui/TextArea.jsx

import { colors, inputs, spacing, typography } from "../../theme";

export default function TextArea({
  label,
  error,
  helpText,
  containerStyle = {},
  textareaStyle = {},
  required = false,
  disabled = false,
  readOnly = false,
  id,
  name,
  ...props
}) {
  const fieldId = id || name;

  return (
    <div style={{ width: "100%", ...containerStyle }}>
      {label ? (
        <label htmlFor={fieldId} style={inputs.label}>
          {label}
          {required ? (
            <span style={{ color: colors.error, marginLeft: 4 }}>*</span>
          ) : null}
        </label>
      ) : null}

      <textarea
        id={fieldId}
        name={name}
        disabled={disabled}
        readOnly={readOnly}
        style={{
          ...inputs.textarea,
          ...(disabled ? inputs.disabled : {}),
          ...(readOnly ? inputs.readOnly : {}),
          ...(error
            ? {
                border: `1px solid ${colors.error}`,
              }
            : {}),
          ...textareaStyle,
        }}
        {...props}
      />

      {error ? (
        <div
          style={{
            marginTop: spacing.xs,
            color: "#FECACA",
            fontSize: typography.size.small,
          }}
        >
          {error}
        </div>
      ) : null}

      {!error && helpText ? (
        <div
          style={{
            marginTop: spacing.xs,
            color: colors.textMuted,
            fontSize: typography.size.small,
          }}
        >
          {helpText}
        </div>
      ) : null}
    </div>
  );
}