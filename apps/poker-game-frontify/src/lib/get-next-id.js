export const getNextId = (arr) => {
  if (arr.length > 0) {
    return arr[arr.length - 1]?.NextId;
  } else return "";
};
