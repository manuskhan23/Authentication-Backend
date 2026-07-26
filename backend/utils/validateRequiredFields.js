import ApiError from "./ApiError.js";

const validateRequiredFields = (body, fields) => {
  const missing = fields.filter((field) => !body?.[field]);

  if (missing.length) {
    throw new ApiError(400, "Required fields are missing...");
  }
};

export default validateRequiredFields;
