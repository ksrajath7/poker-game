import { useState } from "react";
import { patchItem } from "@/lib/api";

export default function useUpdateData(options) {
  const { onSuccess = () => { }, onError = () => { } } = options;
  const [isLoading, setIsLoading] = useState(false);

  const updateData = async (options) => {
    const {
      endpoint,
      payload,
      onsuccess = () => { },
      onerror = () => { },
    } = options;
    setIsLoading(true);
    try {
      const result = await patchItem(endpoint, payload);
      onsuccess(result);
      onSuccess(result);
    } catch (err) {
      console.log(err, "error from patch single item");
      onerror(err);
      onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    updateData,
  };
}
