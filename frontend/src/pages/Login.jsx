import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import FormCard from "../components/FormCard";
import axios from "axios";
import Base_URL from "../Utils";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const loginUser = {
      email: formData.email,
      password: formData.password,
    };

    try {
      const res = await axios.post(
        `${Base_URL}api/v1/login`,
        loginUser
      );

      console.log("Response:", res.data);
      setSuccess("Login successful 🎉");

      // optional: clear form
      setFormData({
        email: "",
        password: "",
      });

    } catch (err) {
      console.log(err.response?.data || err.message);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormCard title="Login">
      <form onSubmit={handleSubmit}>
        <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" />
        <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" />
        <Button text="Login" />
      </form>
      <p className="text-center mt-3">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </FormCard>
  );
};

export default Login;
