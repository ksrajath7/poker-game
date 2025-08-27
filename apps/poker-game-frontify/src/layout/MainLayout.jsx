import { Outlet } from "react-router";
import Header from "../components/App/Header";
import { useEffect, useState } from "react";


const MainLayout = () => {


  const [atTop, setAtTop] = useState(true);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    let lastY = 0;
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY === 0) {
        setAtTop(true);
        setShowSticky(false);
      } else {
        setAtTop(false);
        setShowSticky(currentY < lastY);
      }
      lastY = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  return (
    <>
      <Header />
      {!atTop && <Header isSticky visible={showSticky} />}
      <Outlet />
    </>
  );
};

export default MainLayout;