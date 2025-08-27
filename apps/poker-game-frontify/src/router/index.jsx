// rrd
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router";
import HomePage from "../components/Pages/HomePage";
import MainLayout from "../layout/MainLayout";
import AuthLayout from "../features/auth/layouts/AuthLayout";
import GamePage from "../components/Pages/GamePage";


export const router = createBrowserRouter(
  createRoutesFromElements(
    <>

      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/table/:joinedTableId" element={<GamePage />} />
      </Route>

      {/* </Route> */}
    </>
  )
);
