import { Routes, Route } from "react-router-dom";
import Home from "../app/(protected)/User/Home/HomeUser";
import UserLayout from "../Layout/user";

import Profile from "../app/(protected)/User/Profile";
import MyPost from "../app/(protected)/User/Profile/MyPost";
import MyFav from "../app/(protected)/User/Profile/MyFav";
import MySticker from "../app/(protected)/User/Profile/MySticker";
import EditProfile from "../app/(protected)/User/Profile/EditProfile";


import Reward from "../app/(protected)/User/Reward";
import Message from "../app/(protected)/User/Message";

import Friends from "../app/(protected)/User/Friend";
import FriendRequest from "../app/(protected)/User/Friend/Request";
import FriendPopular from "../app/(protected)/User/Friend/Popular";
import FriendRelation from "../app/(protected)/User/Friend/MyFriend";
import FriendBirthday from "../app/(protected)/User/Friend/Birthday";

import Group from "../app/(protected)/User/Category";
import ReviewListPage from "../app/(protected)/User/Review/ReviewListPage";
import MyReviews from "../app/(protected)/User/Review/MyReviews";
import CreateReviewPage from "../app/(protected)/User/Review/CreateReviewPage";
import Voting from "../app/(protected)/User/Voting";
import Announcement from "../app/(protected)/User/Announcement";
import AnnouncementDetail from "../app/(protected)/User/Announcement/AnnouncementDetail";
import AnnouncementCreate from "../app/(protected)/User/Announcement/AnnouncementCreate";
import Report from "../app/(protected)/User/Report";
import Post from "../app/(protected)/User/Post";
import PostDetail from "../app/(protected)/User/Post/postdetail";
import CreatePost from "../app/(protected)/User/Post/createpost";
import EditPost from "../app/(protected)/User/Post/editpost";

// Poll System
import PollList from "../app/(protected)/User/Poll/PollList";
import MyPolls from "../app/(protected)/User/Poll/MyPolls";
import PollCreate from "../app/(protected)/User/Poll/PollCreate";
import PollDetail from "../app/(protected)/User/Poll/PollDetail";
//import PollArchive from "../app/(protected)/User/Poll/PollArchive";


function UserRoutes() {
  return (
    <Routes>
      <Route element={<UserLayout />}>
        <Route path="/User" element={<Home />} />

        {/* ⭐ PROFILE (Nested Routes) */}
        <Route path="/User/Profile" element={<Profile />}>
          <Route index element={<MyPost />} />      // ⭐ default
          <Route path="post" element={<MyPost />} />
          <Route path="fav" element={<MyFav />} />
          <Route path="sticker" element={<MySticker />} />
        </Route>

        <Route path="/User/Profile/edit" element={<EditProfile />} />


        <Route path="/User/Reward" element={<Reward />} />

        <Route path="/User/Message" element={<Message />} />

        <Route path="/User/Friends" element={<Friends />} />
        <Route path="/User/Friends/Request" element={<FriendRequest />} />
        <Route path="/User/Friends/Popular" element={<FriendPopular />} />
        <Route path="/User/Friends/FriendRelation" element={<FriendRelation />} />
        <Route path="/User/Friends/FriendBirthday" element={<FriendBirthday />} />

        <Route path="/User/Group" element={<Group />} />

        <Route path="/User/Post" element={<Post />} />
        <Route path="/User/Post/detail/:id" element={<PostDetail />} />
        <Route path="/User/Post/create_post" element={<CreatePost />} />
        <Route path="/User/Post/edit/:id" element={<EditPost />} />

        <Route path="/User/Review" element={<ReviewListPage />} />
        <Route path="/User/Review/my" element={<MyReviews />} />
        <Route path="/User/Review/createreview" element={<CreateReviewPage />} />


        {/* <Route path="/User/Voting" element={<Voting />} /> */}

        {/* Poll System Routes */}
        <Route path="/User/Polls" element={<PollList />} />
        <Route path="/User/Polls/my" element={<MyPolls />} />
        <Route path="/User/Polls/create" element={<PollCreate />} />
        <Route path="/User/Polls/edit/:id" element={<PollCreate />} />
        <Route path="/User/Polls/:id" element={<PollDetail />} />



        <Route path="/User/Announcement" element={<Announcement />} />

        <Route path="/User/Announcement/create" element={<AnnouncementCreate />} />
        <Route path="/User/Announcement/:id" element={<AnnouncementDetail />} />

        <Route path="/User/Report" element={<Report />} />

      </Route>
    </Routes>
  );
}

export default UserRoutes;