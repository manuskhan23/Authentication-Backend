const Button = ({ text, type = "submit", onClick, variant = "primary", fullWidth = true }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn btn-${variant} ${fullWidth ? "w-100" : ""}`}
    >
      {text}
    </button>
  );
};

export default Button;
