import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import FormCard from "../components/FormCard";
import Alert from "../components/Alert";
import useAuthForm from "../hooks/useAuthForm";

const Login = () => {
  const { formData, loading, error, success, handleChange, handleSubmit } = useAuthForm({
    initialValues: {
      email: "",
      password: "",
    },
    path: "api/v1/login",
    successMessage: "Login successful 🎉",
    errorMessage: "Login failed",
  });

  return (
    <FormCard title="Login">
      <form onSubmit={handleSubmit}>
        <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" />
        <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" />

        <Alert error={error} success={success} />

        <Button text={loading ? "Logging in..." : "Login"} disabled={loading} />
      </form>
      <p className="text-center mt-3">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </FormCard>
  );
};

export default Login;
