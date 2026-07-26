import { useState } from "react";
import api from "../Utils/api";

// Shared form state + submit flow for the auth pages (login / signup).
const useAuthForm = ({ initialValues, endpoint, successMessage, errorMessage }) => {
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
      await api.post(endpoint, formData);
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
