export const RISK_CODES = {
  A: "Age less than 18 or greater than 35",
  B: "Being less than 145 cm (4'9\") tall",
  C: "Having a fourth (or more) baby (grand multi)",
  D: "Previous caesarian section, 3 consecutive miscarriages, or postpartum",
  E: "Medical conditions: TB, Heart Disease, Diabetes, Bronchial Asthma, Goiter",
};

export const TRIMESTER_COLOR = (t) => {
  if (t === 1) return "blue";
  if (t === 2) return "violet";
  if (t === 3) return "grape";
  return "gray";
};

export const TRIMESTER_LABEL = (t) => {
  if (t === 1) return "1st Trimester";
  if (t === 2) return "2nd Trimester";
  if (t === 3) return "3rd Trimester";
  return "Unknown";
};

export const trimesterTw = (t) => {
  if (t === 1) return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  if (t === 2) return "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300";
  if (t === 3) return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
  return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
};

export const statusTw = (s) => {
  if (!s) return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
  const lower = s.toLowerCase();
  if (lower === "ongoing")   return "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300";
  if (lower === "delivered") return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  if (lower === "high-risk") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
};

export const deliveryTypeTw = (val) =>
  val === "Abnormal"
    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";