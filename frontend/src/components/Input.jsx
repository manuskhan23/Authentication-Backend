const Input = ({ label, type = "text", name, value, onChange, placeholder }) => {
  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-control"
        required
      />
    </div>
  );
};

export default Input;
