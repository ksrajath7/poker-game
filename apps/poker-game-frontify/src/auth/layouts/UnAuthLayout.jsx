import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthProvider";

export default function UnAuthLayout() {
  const { currentUserData } = useAuth();
  return currentUserData ? <Navigate to="/" /> : <Outlet />;
}
