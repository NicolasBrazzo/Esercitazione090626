// const API_URL = import.meta.env.VITE_API_URL;

const API_URL = import.meta.env.VITE_API_URL;

const isLocal = API_URL.includes("localhost") || API_URL.includes("127.0.0.1");

export const apiFetch = (endpoint, options = {}) => {
    return fetch(API_URL + endpoint, {
        credentials: "include",
        ...options
    });
};

// export const apiFetch = (endpoint, options = {}) => {
//   const finalEndpoint =
//     isLocal && !endpoint.endsWith(".php") ? `${endpoint}.php` : endpoint;

//   return fetch(API_URL + endpoint, {
//     credentials: "include",
//     ...options,
//   });
// };

export const copyInviteCode = (copyCode) => {
  navigator.clipboard.writeText(copyCode);
};

export function validateForm(formData, rules) {
  const errors = {};

  for (const field in rules) {
    const value = formData[field] ?? "";
    const fieldRules = rules[field];

    // required
    if (fieldRules.required && !value.trim()) {
      errors[field] = fieldRules.requiredMessage || "Campo obbligatorio.";
      continue;
    }

    // min length
    if (fieldRules.min && value.length < fieldRules.min) {
      errors[field] = `Deve avere almeno ${fieldRules.min} caratteri.`;
      continue;
    }

    // max length
    if (fieldRules.max && value.length > fieldRules.max) {
      errors[field] = `Non può superare ${fieldRules.max} caratteri.`;
      continue;
    }

    // regex
    if (fieldRules.regex && !fieldRules.regex.test(value)) {
      errors[field] = fieldRules.regexMessage || "Formato non valido.";
      continue;
    }

    // custom validator
    if (fieldRules.custom && !fieldRules.custom(value, formData)) {
      errors[field] = fieldRules.customMessage || "Valore non valido.";
    }
  }

  return errors;
}

export const buildFormData = (data) => {
  const formData = new FormData();
  for (const key in data) {
    formData.append(key, data[key]);
  }
  return formData;
};

export async function submitForm({
  endpoint,
  data,
  rules,
  setErrors,
  setLoading,
  onSuccess,
  mapData = (d) => d,
}) {
  const validationErrors = validateForm(data, rules);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  setLoading(true);
  setErrors({});

  try {
    const response = await apiFetch(endpoint, {
      method: "POST",
      body: buildFormData(mapData(data)),
    });

    const result = await response.json();

    if (result.success) {
      onSuccess?.(result);
    } else {
      setErrors(
        result.field
          ? { [result.field]: result.message }
          : { general: result.message || "Errore." }
      );
    }
  } catch {
    setErrors({ general: "Errore di connessione." });
  } finally {
    setLoading(false);
  }
}

