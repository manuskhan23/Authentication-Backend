import { useState } from "react";
import axios from "axios";
import Base_URL from "../Utils";

// Shared form state + submit flow for the auth pages (login / signup).
const useAuthForm = ({ initialValues, path, successMessage, errorMessage }) => {
  const [formData, setFormData] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${Base_URL}${path}`, formData);
      setSuccess(successMessage);
      setFormData(initialValues);
    } catch (err) {
      setError(err.response?.data?.message || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { formData, loading, error, success, handleChange, handleSubmit };
};

export default useAuthForm;
