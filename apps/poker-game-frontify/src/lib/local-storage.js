export const _storeData = (key, item, type = 'object') => {
  if (type === 'string') {
    localStorage.setItem(key, (item));
  }
  else {
    localStorage.setItem(key, JSON.stringify(item));
  }
};

export const _clearData = (key) => {
  localStorage.removeItem(key);
};

export const _retrieveData = (key, type = 'object') => {
  const value = localStorage.getItem(key);
  if (value != null && value != undefined) {
    if (type === 'string') {
      return (value);
    }
    else {
      return JSON.parse(value);
    }
  } else {
    return null;
  }
};

export const _clear = () => {
  localStorage.clear();
};

export const CURRENTUSERDATA = "currentUserData";
export const CURRENTUSERPROFILE = "currentUserProfile";
