export const jsonToQuery = (json) => {
  let result = Object.fromEntries(
    Object.entries(json)
      .map(([key, value]) => [
        key === "StartDate"
          ? "Index[$gte]"
          : key === "EndDate"
          ? "Index[$lte]"
          : key,
        value,
      ])
      .filter(([_, value]) => value !== undefined)
  );

  return new URLSearchParams(result);
};
