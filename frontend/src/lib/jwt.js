// lib/auth.js
import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "./tokenService";

export const getToken = () => getAccessToken();

export const decodeToken = (token) => {
  const finalToken = token || getAccessToken();
  if (!finalToken) return null;

  try {
    return jwtDecode(finalToken);
  } catch (err) {
    console.error("JWT decode error:", err);
    return null;
  }
};

export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;

  return decoded.exp * 1000 < Date.now();
};