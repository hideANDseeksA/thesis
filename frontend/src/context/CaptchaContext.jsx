import { createContext, useContext, useState } from "react";
import Turnstile from "react-turnstile";

const CaptchaContext = createContext();

export function CaptchaProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const reset = () => {
    setToken(null);
    setIsVerified(false);
  };

  const value = {
    token,
    isVerified,
    reset,
  };

  return (
    <CaptchaContext.Provider value={value}>
      {/* GLOBAL TURNSTILE (renders once for whole app) */}
      <div className="fixed bottom-4 right-4 z-[9999] opacity-90 hover:opacity-100">
        <Turnstile
          sitekey={siteKey}
          onVerify={(t) => {
            setToken(t);
            setIsVerified(true);
          }}
        />
      </div>

      {children}
    </CaptchaContext.Provider>
  );
}

export function useCaptcha() {
  return useContext(CaptchaContext);
}