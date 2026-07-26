const Alert = ({ error, success }) => {
  if (!error && !success) return null;

  return (
    <p className={`text-center mt-2 ${error ? "text-red-500" : "text-green-500"}`}>
      {error || success}
    </p>
  );
};

export default Alert;
