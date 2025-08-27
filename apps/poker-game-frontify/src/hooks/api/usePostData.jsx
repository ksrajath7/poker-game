import { useState } from "react";
import { postItem } from "@/lib/api";

export default function usePostData(options) {
  const { onSuccess = () => { }, onError = () => { } } = options;
  const [isLoading, setIsLoading] = useState(false);

  const postData = async (options) => {
    const {
      endpoint,
      payload,
      onsuccess = () => { },
      onerror = () => { },
    } = options;
    setIsLoading(true);
    try {
      const result = await postItem(endpoint, payload);
      onsuccess(result);
      onSuccess(result);
    } catch (err) {
      console.log(err, "error from post single item");
      onerror(err);
      onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    postData,
  };
}
