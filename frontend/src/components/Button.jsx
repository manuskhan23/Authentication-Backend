const Button = ({ text, type = "submit", onClick, variant = "primary", fullWidth = true, disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${fullWidth ? "w-100" : ""}`}
    >
      {text}
    </button>
  );
};

export default Button;
