const FormCard = ({ title, children }) => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "100%", maxWidth: "450px" }}>
        <h2 className="text-center mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default FormCard;
