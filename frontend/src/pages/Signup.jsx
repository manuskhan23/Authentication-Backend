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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Signup Data:", formData);
    alert("Signup form submitted! Check console for data.");
  };

  const signupUser = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    password: formData.password,
  };

      axios
      .post(`${Base_URL}/api/v1/signup`, signupUser)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });

  return (
    <FormCard title="Sign Up">
      <form onSubmit={handleSubmit}>
        <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" />
        <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter last name" />
        <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" />
        <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" />
        <Button text="Sign Up" />
      </form>
      <p className="text-center mt-3">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </FormCard>
  );
};

export default Signup;
