export const queryToJson = (query) => {
  const params = new URLSearchParams(query);
  const obj = {};
  for (const [key, value] of params) {
    if (obj[key]) {
      if (Array.isArray(obj[key])) {
        obj[key].push(value);
      } else {
        obj[key] = [obj[key], value];
      }
    } else {
      obj[key] = value;
    }
  }
  return obj;
};
