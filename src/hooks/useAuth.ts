import { useNavigate } from "react-router-dom";

export function useAuth() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, you would clear auth tokens/state here
    navigate("/");
  };

  return { handleLogout };
}
