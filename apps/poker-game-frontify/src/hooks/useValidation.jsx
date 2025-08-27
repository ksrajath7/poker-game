import { useState, useCallback, useEffect } from "react";

export function useValidation(schema) {
  const [errors, setErrors] = useState({});

  const validateField = useCallback(
    (key, value, currentValues) => {
      const merged = { ...currentValues, [key]: value };

      const { error } = schema.validate(merged, {
        abortEarly: false,
      });

      // Construct the path for the key we're validating
      // This is crucial for nested fields
      const targetPath = key.split("."); // Example: "Fee.Type" -> ["Fee", "Type"]

      let hasThisKeyError = false;
      let newError = null;

      if (error && error.details) {
        const matchingDetail = error.details.find((d) => {
          // Check if the error detail's path exactly matches our target path
          return (
            d.path.length === targetPath.length &&
            d.path.every((segment, index) => segment === targetPath[index])
          );
        });

        if (matchingDetail) {
          hasThisKeyError = true;
          newError = { [key]: matchingDetail.message }; // Store with the original key
        }
      }

      setErrors((prev) => {
        if (hasThisKeyError) {
          return {
            ...prev,
            ...newError,
          };
        } else {
          // Remove error for this key if it no longer exists
          const { [key]: _, ...rest } = prev;
          return rest;
        }
      });

      return !hasThisKeyError;
    },
    [schema]
  );

  const validateAll = useCallback(
    (values) => {
      const { error } = schema.validate(values, {
        abortEarly: false,
      });

      if (error && error.details) {
        const fieldErrs = {};
        error.details.forEach((d) => {
          // Use the full path as the key for the error state
          const errorPath = d.path.join(".");
          // Assign the message to this specific path
          fieldErrs[errorPath] = d.message;
        });
        setErrors(fieldErrs);
        return false;
      } else {
        setErrors({});
        return true;
      }
    },
    [schema]
  );

  const resetValidation = useCallback(() => setErrors({}), []);

  useEffect(() => {
    console.log(errors);
  }, [errors]);

  return { errors, validateField, validateAll, resetValidation };
}
