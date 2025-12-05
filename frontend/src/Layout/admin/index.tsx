import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from '../../components/SideBar';
import Header from "../../components/Header";

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <SideBar role="admin" />
      <div className="flex flex-col">
        <Header role="admin" username="Admin" />
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
