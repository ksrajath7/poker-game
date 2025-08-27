import { getItem } from "@/lib/api";
import { getNextId } from "@/lib/get-next-id";
import { jsonToQuery } from "@/lib/json-to-query";
import { runOnce } from "@/lib/run-once";
import { useEffect, useState } from "react";

export default function useGetList(options) {
  const {
    endpoint = "",
    extraParams = {},
    initialFilters = {},
    checkLeft = true,
    loadInitial = true,
    changeOnFilter = false,
    extraDependencies = [],
  } = options;
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPageDisabled, setIsPageDisabled] = useState(true);

  const [filters, setFilters] = useState({
    OrderBy: "Index",
    Keyword: "",
    Limit: -1,
    StartDate: null,
    EndDate: null,
    ...initialFilters,
  });

  function updateFilter(oby, kw, lt, sd, ed) {
    setFilters({
      OrderBy: oby,
      Keyword: kw,
      Limit: lt,
      StartDate: sd,
      EndDate: ed,
    });
  }

  function changeSingleFilter(key, value) {
    if (value === null) {
      let tempFilters = filters;
      delete tempFilters[key];
      setFilters(tempFilters);
    } else {
      setFilters({
        ...filters,
        [key]: value,
      });
    }
  }

  const setLoadingState = (temp, value) => {
    if (temp.length > 0) {
      setIsLoadingMore(value);
    } else {
      setIsLoading(value);
    }
  };
  const dependencies = changeOnFilter
    ? [filters, ...extraDependencies]
    : [...extraDependencies];
  const getList = runOnce(async (temp, fromUpdate = true) => {
    console.log(filters);
    const query = `${endpoint}?${jsonToQuery({
      ...filters,
      ...extraParams,
    })}&NextId=${getNextId(temp)}`;

    setLoadingState(temp, true);
    try {
      const result = await getItem(query);
      if (fromUpdate) {
        setData(result);
      } else {
        setData((prevData) => [...prevData, ...result]);
      }
    } catch (err) {
      console.log(err, "error from get list");
    } finally {
      setLoadingState(temp, false);
    }
  });

  const checkMoreLeft = runOnce(async (temp) => {
    const query = `${endpoint}?${jsonToQuery({
      ...filters,
      ...extraParams,
      Limit: 1,
    })}&NextId=${getNextId(temp)}`;

    try {
      const result = await getItem(query);
      setIsPageDisabled(!(result?.length > 0));
    } catch (err) {
      console.log(err, "error from get list more");
      setIsPageDisabled(true);
    }
  });

  useEffect(() => {
    if (loadInitial) {
      getList([]);
    }
  }, dependencies);

  useEffect(() => {
    if (checkLeft) {
      if (data.length > 0) checkMoreLeft(data);
    }
  }, [data]);

  return {
    data,
    setData,
    isLoading,
    isLoadingMore,
    isPageDisabled,
    filters,
    setFilters,
    updateFilter,
    getList,
    changeSingleFilter,
  };
}
