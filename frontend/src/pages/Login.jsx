import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import FormCard from "../components/FormCard";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", formData);
    alert("Login form submitted! Check console for data.");
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
