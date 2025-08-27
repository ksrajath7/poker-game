import { deleteItem } from "@/lib/api";
import { useState } from "react";

export default function useDeleteData(options) {
  const { onSuccess = () => { }, onError = () => { } } = options;
  const [isLoading, setIsLoading] = useState(false);

  const deleteData = async (options = {}) => {
    const {
      endpoint = "",
      payload = {},
      onsuccess = () => { },
      onerror = () => { },
    } = options;
    const api = endpoint;
    setIsLoading(true);
    try {
      const result = await deleteItem(api, payload);
      onsuccess(result);
      onSuccess(result);
    } catch (err) {
      console.log(err, "error from delete single item");
      onerror(err);
      onError(err);
    } finally {
      setIsLoading(false);
    }
  };
  return {
    isLoading,
    deleteData,
  };
}
