const validateName = (value, fieldLabel = "Il campo") => {
  const errors = [];

  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${fieldLabel} è obbligatorio`);
    return errors;
  }

  const trimmed = value.trim();

  if (trimmed.length < 2) {
    errors.push(`${fieldLabel} deve contenere almeno 2 caratteri`);
  }
  if (trimmed.length > 50) {
    errors.push(`${fieldLabel} non può superare i 50 caratteri`);
  }
  if (!/^[A-Za-zÀ-ÿ' -]+$/.test(trimmed)) {
    errors.push(`${fieldLabel} può contenere solo lettere, spazi, apostrofi e trattini`);
  }

  return errors;
};

module.exports = { validateName };
