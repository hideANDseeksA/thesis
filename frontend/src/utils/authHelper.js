import { decodeToken } from "@/lib/jwt";

export const handleLoginSuccess = ({
  accessToken,
  setAccessToken,
  setUser,
  setResident_Data,
  setItem,
  navigate,
}) => {
  if (!accessToken) throw new Error("Invalid login response");

  // Save token in state
  setAccessToken(accessToken);

  // Decode token
  const decoded = decodeToken(accessToken);
  if (!decoded || !decoded.role) throw new Error("Invalid token");

  // Store resident info
  setItem("resident_id", decoded.resident_id);
  setResident_Data(decoded.data);

  // Set user state
  setUser({
    id: decoded.id,
    role: decoded.role,
  });

  // Role based navigation
  switch (decoded.role) {
    case "staff":
      navigate("/dashboard");
      break;
    case "healthworker":
      navigate("/dashboard");
      break;
    case "resident":
      navigate("/resident/dashboard");
      break;
    default:
      navigate("/login");
  }
};