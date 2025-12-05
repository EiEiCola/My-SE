import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from '../../components/SideBar';
import Header from "../../components/Header";

const UserLayout: React.FC = () => {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <SideBar role="user" />
      <div className="flex flex-col">
        <Header role="user" username="User" />
        <Outlet />
      </div>
    </div>
  );
};

export default UserLayout;
