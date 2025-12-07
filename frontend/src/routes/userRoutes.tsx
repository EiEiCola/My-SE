import { Routes, Route } from "react-router-dom";
import Home from "../app/(protected)/User/Home/HomeUser";
import UserLayout from "../Layout/user";
import Profile from "../app/(protected)/User/Profile";
import Reward from "../app/(protected)/User/Reward";
import Message from "../app/(protected)/User/Message";
import Friends from "../app/(protected)/User/Friend";
import Group from "../app/(protected)/User/Category";
import Review from "../app/(protected)/User/Review";
import Voting from "../app/(protected)/User/Voting";
import Announcement from "../app/(protected)/User/Announcement";
import AnnouncementDetail from "../app/(protected)/User/Announcement/AnnouncementDetail";
import Report from "../app/(protected)/User/Report";
import Post from "../app/(protected)/User/Post";

function UserRoutes() {
  return (
    <Routes>
      <Route element={<UserLayout />}>
        <Route path="/User" element={<Home />} />

        <Route path="/User/Profile" element={<Profile />} />

        <Route path="/User/Reward" element={<Reward />} />

        <Route path="/User/Message" element={<Message />} />

        <Route path="/User/Friends" element={<Friends />} />

        <Route path="/User/Group" element={<Group />} />

        <Route path="/User/Post" element={<Post />} />

        <Route path="/User/Review" element={<Review />} />

        <Route path="/User/Voting" element={<Voting />} />

        <Route path="/User/Announcement" element={<Announcement />} />

        <Route path="/User/Announcement/:id" element={<AnnouncementDetail />} />

        <Route path="/User/Report" element={<Report />} />

      </Route>
    </Routes>
  );
}

export default UserRoutes;
