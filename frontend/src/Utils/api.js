import axios from "axios";
import Base_URL from "./index.jsx";

const api = axios.create({
  baseURL: Base_URL,
});

export default api;
