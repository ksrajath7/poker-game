import { useEffect, useState } from "react";
import { runOnce } from "@/lib/run-once";
import { getItem } from "@/lib/api";

export default function useGetData(options) {
  const {
    endpoint,
    onSuccess = () => { },
    onError = () => { },
    fetchOnRender = true,
  } = options;

  const [data, setData] = useState();
  const [isLoading, setIsLoading] = useState(fetchOnRender);

  const getData = runOnce(async (options = {}) => {
    const { endPoint = "", onsuccess = () => { }, onerror = () => { } } = options;
    const query = endPoint !== "" ? endPoint : endpoint;

    setIsLoading(true);
    try {
      const result = await getItem(query);
      setData(result);
      onsuccess(result);
      onSuccess(result);
    } catch (err) {
      console.log(err, "error from get list");
      onError(err);
      onerror(err);
    } finally {
      setIsLoading(false);
    }
  });


  useEffect(() => {
    if (fetchOnRender === true) {
      getData();
    }
  }, []);

  return {
    data,
    isLoading,
    getData,
    setData,
    setIsLoading,
  };
}
