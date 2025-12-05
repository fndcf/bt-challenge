/**
 * Hook para gerenciar formulários
 */

import { useState } from "react";

export const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = (name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Limpar erro quando usuário começa a digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const setFieldError = (name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const setFieldValue = (name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const hasErrors = Object.values(errors).some((error) => error !== undefined);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldError,
    setFieldValue,
    setErrors,
    reset,
    hasErrors,
  };
};

export default useForm;
