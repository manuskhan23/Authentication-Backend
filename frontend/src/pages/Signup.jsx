import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import FormCard from "../components/FormCard";
import Alert from "../components/Alert";
import useAuthForm from "../hooks/useAuthForm";

const Signup = () => {
  const { formData, loading, error, success, handleChange, handleSubmit } = useAuthForm({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
    endpoint: "api/v1/signup",
    successMessage: "Signup successful 🎉",
    errorMessage: "Signup failed",
  });

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

        <Alert error={error} success={success} />

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
