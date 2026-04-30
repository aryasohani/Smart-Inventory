import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:8001", // your backend
  baseURL: "http://127.0.0.1:8000", // your backend
});

// const API_BASE = "http://127.0.0.1:8001";

export default API;