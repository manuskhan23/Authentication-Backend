import ApiError from "./ApiError.js";

const validateRequiredFields = (body, fields, message = "Required fields are missing...") => {
  const missing = fields.filter((field) => !body?.[field]);

  if (missing.length) {
    throw new ApiError(400, message);
  }
};

export default validateRequiredFields;
