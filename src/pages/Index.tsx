
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to login if not logged in
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      // Redirect to dashboard if already logged in
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);
  
  return null; // Render nothing, just redirect
};

export default Index;
