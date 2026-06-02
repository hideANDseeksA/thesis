import {api} from "@/lib/axios";

export const login = async (email, password) => {
  const res = await api.post("/auth/login", {
    email_address: email,
    password,
  });
  return res.data;
}

export const googleLogin = async (token) => {
  const res = await api.post("/auth/google-login", 
    {
        token,
    });
    return res.data;
}

export const signup = async ( email, password) => {

    const res = await api.post("/auth/signup", {
        email_address: email,
        password,
    });
    return res.data;
}

export const googleSignup = async (token) => {
  const res = await api.post("/auth/google-signup", 
    { 
        token,
    });
    return res.data;
}

export const verifyEmail = async (token) => {
  const res = await api.post("/auth/verify-email", {
      token,
  });
  return res.data;
}


export const resendVerificationEmail = async (token) => {
  const res = await api.post("/auth/resend-verification-email", {
    token
  });
  return res.data;
}

export const sendVerificationEmail = async (email) => {
  const res = await api.post("/auth/send-verification", {
    email: email,
  });
  return res.data;
}


export const forgotPassword = async (email) => {
  const res = await api.post("/auth/forgot-password", {
    email_address: email,
  });
  return res.data;
}

export const resetPassword = async (token, newPassword) => {
  const res = await api.post("/auth/reset-password", {
    token,
    password: newPassword,
  });

  return res.data;
};