import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import FormCard from "../components/FormCard";
import axios from "axios";
import Base_URL from "../Utils";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const signupUser = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    };

    try {
      const res = await axios.post(
        `${Base_URL}api/v1/signup`,
        signupUser
      );

      console.log("Response:", res.data);
      setSuccess("Signup successful 🎉");

      // optional: clear form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });

    } catch (err) {
      console.log(err.response?.data || err.message);
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormCard title="Sign Up">
      <form onSubmit={handleSubmit}>

        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="Enter first name"
        />

        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Enter last name"
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email"
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter password"
        />

        {error && (
          <p className="text-red-500 text-center mt-2">{error}</p>
        )}

        {success && (
          <p className="text-green-500 text-center mt-2">{success}</p>
        )}

        <Button
          text={loading ? "Signing up..." : "Sign Up"}
          disabled={loading}
        />
      </form>

      <p className="text-center mt-3">
        Already have an account?{" "}
        <Link to="/login">Login</Link>
      </p>
    </FormCard>
  );
};

export default Signup;