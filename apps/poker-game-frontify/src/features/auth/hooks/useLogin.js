import { useAuth } from "../context/AuthProvider";

export default function useLogin() {
  const { updateCurrentUser } = useAuth();
  const login = (loggedInUser) => {
    updateCurrentUser(loggedInUser);
  };
  return { login };
}
