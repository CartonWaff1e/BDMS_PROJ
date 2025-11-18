import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4872/api", // change to your backend port if needed
  timeout: 10000,
});

export default API;
