import { Routes, Route } from "react-router-dom";
import Home from "../app/(protected)/Admin/Home/HomeAdmin";
import AdminLayout from "../Layout/admin";
import ProfileManage from "../app/(protected)/Admin/ProfileManage";
import EditAdminProfile from "../app/(protected)/Admin/ProfileManage/EditProfile";
import RewardManage from "../app/(protected)/Admin/RewardManage";
import PointRuleManage from "../app/(protected)/Admin/RewardManage/PointRuleManage";
import MessageManage from "../app/(protected)/Admin/MessageManage";
import FriendsManage from "../app/(protected)/Admin/FriendManage";
import GroupManage from "../app/(protected)/Admin/CategoryManage";
import PostManage from "../app/(protected)/Admin/PostManage";
import ReviewManage from "../app/(protected)/Admin/ReviewManage";
import VotingManage from "../app/(protected)/Admin/VotingManage";
import AnnouncementManage from "../app/(protected)/Admin/AnnouncementManage";
import AnnouncementsList from "../app/(protected)/Admin/AnnouncementManage/AnnouncementsList";
import AnnouncementRequestDetail from "../app/(protected)/Admin/AnnouncementManage/AnnouncementRequestDetail";
import AdminAnnouncementCreate from "../app/(protected)/Admin/AnnouncementManage/AdminAnnouncementCreate";
import ReportManage from "../app/(protected)/Admin/ReportManage";
import AdminPollList from "../app/(protected)/Admin/Poll/AdminPollList";

function AdminRoutes() {
  return (
    <Routes>
      {/* ✅ ให้ Layout match /Admin ทุกหน้า */}
      <Route path="/Admin/*" element={<AdminLayout />}>
        {/* ✅ /Admin */}
        <Route index element={<Home />} />

        <Route path="ProfileManage" element={<ProfileManage />} />
        <Route path="Profile/Edit" element={<EditAdminProfile />} />

        <Route path="RewardManage" element={<RewardManage />} />
        <Route path="RewardManage/PointRule" element={<PointRuleManage />} />

        <Route path="MessageManage" element={<MessageManage />} />
        <Route path="FriendsManage" element={<FriendsManage />} />
        <Route path="GroupManage" element={<GroupManage />} />
        <Route path="PostManage" element={<PostManage />} />
        <Route path="ReviewManage" element={<ReviewManage />} />
        <Route path="VotingManage" element={<VotingManage />} />
        <Route path="PollManage" element={<AdminPollList />} />
        <Route path="AnnouncementManage" element={<AnnouncementManage />} />
        <Route path="AnnouncementManage/create" element={<AdminAnnouncementCreate />} />
        <Route path="AnnouncementManage/Announcements" element={<AnnouncementsList />} />
        <Route path="AnnouncementManage/:id" element={<AnnouncementRequestDetail />} />
        <Route path="ReportManage" element={<ReportManage />} />
      </Route>
    </Routes>
  );
}

export default AdminRoutes;
