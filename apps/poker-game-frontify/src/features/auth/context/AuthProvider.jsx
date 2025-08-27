import {
  _clear,
  _retrieveData,
  _storeData,
  CURRENTUSERDATA,
} from "@/lib/local-storage";
import { createContext, useContext, useState } from "react";
import { _clearData, CURRENTUSERPROFILE } from "../../../lib/local-storage";

const AuthContext = createContext();

const getLocalUser = () => {
  const raw = _retrieveData(CURRENTUSERDATA);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    console.warn("Malformed user data in localStorage");
    return null;
  }
};
const getLocalUserProfile = () => {
  const raw = _retrieveData(CURRENTUSERPROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    console.warn("Malformed user data in localStorage");
    return null;
  }
};
export const AuthProvider = ({ children }) => {

  const [currentUserData, setCurrentUserData] = useState(getLocalUser);
  const [currentUserProfile, setCurrentUserProfile] = useState(getLocalUserProfile);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleLoginClick = () => {
    setIsMenuOpen(false)
    setShowAuthModal(true);
  }

  const updateCurrentUser = async (userData) => {
    setCurrentUserData(userData);
    _storeData(CURRENTUSERDATA, JSON.stringify(userData));
  };

  const updateCurrentUserProfile = async (userProfile) => {
    setCurrentUserProfile(userProfile);
    _storeData(CURRENTUSERPROFILE, JSON.stringify(userProfile));
  };

  const logout = () => {
    setIsMenuOpen(false)
    setCurrentUserData(null);
    _clearData(CURRENTUSERDATA)
    setCurrentUserProfile(null);
    _clearData(CURRENTUSERPROFILE)
  };

  const value = {
    currentUserData, updateCurrentUser,
    isMenuOpen, setIsMenuOpen,
    showAuthModal, setShowAuthModal,
    logout, handleLoginClick,
    showAddForm, setShowAddForm,
    currentUserProfile, setCurrentUserProfile, updateCurrentUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {

  return useContext(AuthContext);

};