import { Routes, Route } from 'react-router-dom'
import Home from '../app/(protected)/Admin/Home/HomeAdmin'
import AdminLayout from '../Layout/admin'
import ProfileManage from "../app/(protected)/Admin/ProfileManage";

import RewardManage from "../app/(protected)/Admin/RewardManage";
import PointRuleManage from "../app/(protected)/Admin/RewardManage/PointRuleManage";
 

import MessageManage from "../app/(protected)/Admin/MessageManage";
import FriendsManage from "../app/(protected)/Admin/FriendManage";
import GroupManage from "../app/(protected)/Admin/CategoryManage";
import PostManage from "../app/(protected)/Admin/PostManage";
import ReviewManage from "../app/(protected)/Admin/ReviewManage";
import VotingManage from "../app/(protected)/Admin/VotingManage";
import AnnouncementManage from "../app/(protected)/Admin/AnnouncementManage";
import AnnouncementRequestDetail from "../app/(protected)/Admin/AnnouncementManage/AnnouncementRequestDetail";
import ReportManage from "../app/(protected)/Admin/ReportManage";
function AdminRoutes() {
  return (
   <Routes>
      {/* Layout ของ Admin ครอบทุก route ที่ขึ้นต้น /Admin */}
      <Route element={<AdminLayout />}>
        <Route path="/Admin" element={<Home />} />

        <Route path="/Admin/ProfileManage" element={<ProfileManage />} />

        <Route path="/Admin/RewardManage" element={<RewardManage />} />

        <Route 
          path="/Admin/RewardManage/PointRule" element={<PointRuleManage />} />


        <Route path="/Admin/MessageManage" element={<MessageManage />} />

        <Route path="/Admin/FriendsManage" element={<FriendsManage />} />

        <Route path="/Admin/GroupManage" element={<GroupManage />} />

        <Route path="/Admin/PostManage" element={<PostManage />} />

        <Route path="/Admin/ReviewManage" element={<ReviewManage />} />

        <Route path="/Admin/VotingManage" element={<VotingManage />} />

        <Route path="/Admin/AnnouncementManage" element={<AnnouncementManage />} />
        <Route path="/Admin/AnnouncementManage/:id" element={<AnnouncementRequestDetail />} />

        <Route path="/Admin/ReportManage" element={<ReportManage />} />

      </Route>
    </Routes>
  )
}

export default AdminRoutes
