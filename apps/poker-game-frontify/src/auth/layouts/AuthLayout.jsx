import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthProvider";

export default function AuthLayout() {
  const { currentUserData } = useAuth();
  return !currentUserData ? <Navigate to="login" /> : <Outlet />;
}
