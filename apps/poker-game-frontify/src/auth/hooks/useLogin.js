import { useState } from "react";
import { useAuth } from "../context/AuthProvider";
import usePostData from "@/hooks/api/usePostData";

export default function useLogin() {
  const [user, setUser] = useState({ Username: "", Password: "" });
  const { updateCurrentUser } = useAuth();
  const { isLoading, postData } = usePostData({
    onSuccess: (result) => {
      updateCurrentUser(result);
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const login = () => {
    postData({ endpoint: "admin/login", payload: user });
  };
  return { isLoading, login, user, setUser };
}
