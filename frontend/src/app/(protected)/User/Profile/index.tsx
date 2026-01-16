import React, { useState, useEffect } from "react";
import { Card, Button, Typography, Avatar, Tabs, App as AntApp } from "antd";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

// ⭐ Icons
import CakeIcon from "@mui/icons-material/Cake";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EditIcon from "@mui/icons-material/Edit";

// ⭐ NEW ICONS FOR TABS
import DescriptionIcon from "@mui/icons-material/Description";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CrueltyFreeIcon from "@mui/icons-material/CrueltyFree";

// ✅ use separated API
import { memberAPI } from "../../../../services/http/member_profile";
import { friendAPI, getImageUrl } from "../../../../services/http/friend";

const { Title, Text } = Typography;

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { message, modal } = AntApp.useApp();

  // tab ที่แอคทีฟ
  const [activeTab, setActiveTab] = useState("post");

  // ⭐ STATE โปรไฟล์
  const [profile, setProfile] = useState<any>({
    username: "loading...",
    friends: 0,
    followers: 0,
    following: 0,
    bio: "",
    gender: "",
    dob: "",
    avatar: "",
  });

  // ⭐ Popup state
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [popupTab, setPopupTab] = useState("friends");
  const [popupList, setPopupList] = useState<any[]>([]);

  // ⭐ Real Data Lists
  const [friendList, setFriendList] = useState<any[]>([]);
  const [followerList, setFollowerList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [requestList, setRequestList] = useState<any[]>([]);

  // ✅ โหลดโปรไฟล์จาก backend ด้วย JWT: GET /api/member/me
  // ✅ โหลดโปรไฟล์จาก backend ด้วย JWT: GET /api/member/me
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, friendsRes, followersRes, followingRes, requestsRes] = await Promise.all([
          memberAPI.getMe(),
          friendAPI.getMyFriends(),
          friendAPI.getMyFollowers(),
          friendAPI.getMyFollowing(),
          friendAPI.getReceivedRequests(),
        ]);

        const data = meRes.data;

        // Process Friends
        const friends = friendsRes.data ? friendsRes.data.map((f: any) => ({
          id: f.id || f.ID || f.member_id,
          username: f.username,
          avatar: getImageUrl(f.member_picture),
          status: "friend"
        })) : [];
        setFriendList(friends);

        // Process Followers
        const followers = followersRes.data ? followersRes.data.map((f: any) => ({
          id: f.id || f.ID || f.member_id,
          username: f.username,
          avatar: getImageUrl(f.member_picture),
          status: "follower"
        })) : [];
        setFollowerList(followers);

        // Process Following
        const following = followingRes.data ? followingRes.data.map((f: any) => ({
          id: f.id || f.ID || f.member_id,
          username: f.username,
          avatar: getImageUrl(f.member_picture),
          status: "following"
        })) : [];
        setFollowingList(following);

        // Process Requests
        // Note: Check FriendRequestUI structure in friend.ts if needed
        // Assuming data structure based on typical API response
        const requests = requestsRes.data ? requestsRes.data.map((r: any) => ({
          // Request object might have nested user info or flat
          // Checking friend.ts: getReceivedRequests returns data directly
          id: r.sent_member_id || r.sent_mem_id || (r.sent_member ? r.sent_member.id : 0), // Adjust based on actual API
          item_id: r.id || r.ID, // The Request ID
          // ... other fields if needed for matching
        })) : [];
        setRequestList(requests);

        // map gender จาก gender_id ถ้า string ว่าง
        let genderText: string = data.gender || "";
        if (!genderText) {
          if (data.gender_id === 1) genderText = "Male";
          else if (data.gender_id === 2) genderText = "Female";
          else if (data.gender_id === 3) genderText = "Other";
        }

        setProfile({
          username: data.username || "",
          friends: friends.length,
          followers: followers.length,
          following: following.length,
          bio: data.bio || "",
          gender: genderText,
          dob: data.dob || "",
          avatar: data.member_picture || "",
        });

      } catch (err: any) {
        console.error("Failed to load profile:", err);

        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        // fallback กันหน้าขาว
        setProfile((p: any) => ({
          ...p,
          username: "loading...",
          bio: "",
          gender: "",
          dob: "",
          avatar: "",
        }));
      }
    };

    fetchData();
  }, [navigate]);

  // ⭐ sync activeTab จาก path ปัจจุบัน
  useEffect(() => {
    const segments = location.pathname.split("/");
    const lastSegment = segments[segments.length - 1];

    const validTabs = ["post", "fav", "sticker"];
    if (validTabs.includes(lastSegment)) setActiveTab(lastSegment);
    else setActiveTab("post");
  }, [location.pathname]);

  const openPopup = (type: string) => {
    setPopupTab(type);
    setPopupOpen(true);

    if (type === "friends") setPopupList(friendList);
    if (type === "followers") setPopupList(followerList);
    if (type === "following") setPopupList(followingList);
  };

  // ⭐ เวลาเปลี่ยนแท็บ
  const handleTabChange = (key: string) => {
    navigate(`/User/Profile/${key}`);
  };

  // ⭐ Smart Navigate Logic
  const handleSmartNavigate = (user: any) => {
    setPopupOpen(false);

    // 1. Is Friend?
    const isFriend = friendList.some(f => f.id === user.id);
    if (isFriend) {
      navigate("/User/Friends/FriendRelation", { state: { selectedId: user.id } });
      return;
    }

    // 2. Has Request?
    // Need to match user.id with sender in requestList
    // Check requestList structure from earlier step
    const hasRequest = requestList.some(r => r.id === user.id);
    if (hasRequest) {
      navigate("/User/Friends/Request");
      return;
    }

    // 3. Fallback / Not Following / Others -> Popular
    navigate("/User/Friends/Popular", { state: { selectedId: user.id } });
  };

  // ⭐ Actions with Confirmation
  const confirmAction = (action: string, user: any) => {
    let title = "";
    let content = "";
    let onOk = async () => { };

    if (action === "view") {
      handleSmartNavigate(user);
      return;
    }

    switch (action) {
      case "unfriend":
        console.log("Confirm Action: unfriend", user);
        title = "Unfriend";
        content = `Are you sure you want to unfriend ${user.username || "this user"}?`;
        onOk = async () => {
          try {
            await friendAPI.unfriend(user.id);
            message.success(`Unfriended ${user.username}`);
            // Update Friend List & Popup List
            setFriendList(prev => prev.filter(f => f.username !== user.username));
            setPopupList(prev => prev.filter(item => item.username !== user.username)); // ⭐ Update visible list
            setProfile((prev: any) => ({ ...prev, friends: Math.max(0, prev.friends - 1) }));
          } catch (e) { message.error("Failed to unfriend"); }
        };
        break;
      case "follow_back":
        title = "Follow Back";
        content = `Do you want to follow ${user.username}?`;
        onOk = async () => {
          try {
            await friendAPI.followUser(user.id);
            message.success(`Followed ${user.username}`);
            // Update Following List (Add user)
            // Note: We might not have full user details to add to following list perfectly without re-fetching,
            // but for stats and buttons it's fine.
            // Ideally: fetch user profile or constructed object.
            // For now, let's just update stats and maybe refetch background or just leave list as is (it's followers tab).
            setProfile((prev: any) => ({ ...prev, following: prev.following + 1 }));

            // Allow immediate UI feedback if we need to change button state?
            // Since "Follow Back" button depends on 'followingList', we should add a dummy entry to followingList
            setFollowingList(prev => [...prev, { ...user, status: 'following' }]);

          } catch (e) { message.error("Failed to follow"); }
        };
        break;
      case "remove_follower":
        // console.log("Confirm Action: remove_follower", user);
        title = "Remove Follower";
        content = `Are you sure you want to remove ${user.username || "this user"} from your followers?`;
        onOk = async () => {
          try {
            await friendAPI.removeFollower(user.id);
            message.success(`Removed ${user.username} from followers`);

            // ⭐ Immediate Update
            setFollowerList(prev => prev.filter(f => f.username !== user.username));
            setPopupList(prev => prev.filter(item => item.username !== user.username)); // Update visible Popup
            setProfile((prev: any) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));

          } catch (e) { message.error("Failed to remove follower"); }
        };
        break;
      case "unfollow":
        // console.log("Confirm Action: unfollow", user);
        title = "Unfollow";
        content = `Are you sure you want to unfollow ${user.username || "this user"}?`;
        onOk = async () => {
          try {
            await friendAPI.unfollowUser(user.id);
            message.success(`Unfollowed ${user.username}`);

            // ⭐ Immediate Update
            setFollowingList(prev => prev.filter(f => f.username !== user.username));
            setPopupList(prev => prev.filter(item => item.username !== user.username)); // Update visible Popup
            setProfile((prev: any) => ({ ...prev, following: Math.max(0, prev.following - 1) }));

          } catch (e) { message.error("Failed to unfollow"); }
        };
        break;
    }

    // Using Ant Design Modal.confirm
    modal.confirm({
      title: title,
      content: content,
      centered: true,
      okText: 'Yes',
      cancelText: 'No',
      zIndex: 3000,
      onOk: onOk,
    });
  };

  const switchPopupTab = (key: string) => {
    setPopupTab(key);

    if (key === "friends") setPopupList(friendList);
    if (key === "followers") setPopupList(followerList);
    if (key === "following") setPopupList(followingList);
  };

  return (
    <main
      style={{
        flex: 1,
        padding: "40px",
        overflowY: "auto",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1100 }}>
        {/* ⭐ PROFILE HEADER */}
        <Card
          style={{
            borderRadius: 28,
            padding: "35px 40px",
            marginBottom: 30,
            background: "#FFFFFF",
            boxShadow: "0px 8px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Avatar
              size={150}
              src={profile.avatar || undefined}
              style={{
                fontSize: 40,
                fontWeight: 700,
              }}
            >
              {profile.username?.[0]?.toUpperCase() || "U"}
            </Avatar>

            <div style={{ flex: 1, marginLeft: 40 }}>
              <Title
                level={3}
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 650,
                  color: "#C42E0A",
                }}
              >
                {profile.username}
              </Title>

              <div style={{ display: "flex", marginTop: 15 }}>
                <div
                  style={{ paddingRight: 140, cursor: "pointer" }}
                  onClick={() => openPopup("friends")}
                >
                  <Title level={4} style={{ margin: 0, color: "black", fontWeight: 700 }}>
                    {profile.friends}
                  </Title>
                  <Text style={{ fontWeight: 500, color: "#5c5c5c" }}>friends</Text>
                </div>

                <div
                  style={{ paddingRight: 140, cursor: "pointer" }}
                  onClick={() => openPopup("followers")}
                >
                  <Title level={4} style={{ margin: 0, color: "black", fontWeight: 700 }}>
                    {profile.followers}
                  </Title>
                  <Text style={{ fontWeight: 500, color: "#5c5c5c" }}>followers</Text>
                </div>

                <div
                  style={{ paddingRight: 140, cursor: "pointer" }}
                  onClick={() => openPopup("following")}
                >
                  <Title level={4} style={{ margin: 0, color: "black", fontWeight: 700 }}>
                    {profile.following}
                  </Title>
                  <Text style={{ fontWeight: 500, color: "#5c5c5c" }}>following</Text>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <Text style={{ whiteSpace: "pre-line", fontSize: 16, fontWeight: 400 }}>
                  {profile.bio}
                </Text>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: 14,
                    color: "#C42E0A",
                    fontSize: 16,
                    fontWeight: 600,
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <PeopleAltIcon style={{ color: "#C42E0A", marginRight: 6 }} />
                    {profile.gender || "—"}
                  </div>

                  <span>•</span>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <CakeIcon style={{ color: "#C42E0A", marginRight: 6 }} />
                    {profile.dob || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* ⭐ EDIT PROFILE BUTTON */}
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/User/Profile/Edit")}
              style={{
                backgroundColor: "#9c2510",
                borderRadius: 10,
                padding: "0 10px",
                fontWeight: 600,
                height: 32,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <EditIcon style={{ color: "white", fontSize: 18 }} />
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* ⭐ TABS */}
        <style>{`
          .orange-tabs .ant-tabs-ink-bar {
            background-color: #C42E0A !important;
            height: 3px !important;
            border-radius: 2px;
          }
        `}</style>

        <Card
          style={{
            borderRadius: 28,
            padding: "25px 30px",
            background: "#FFFFFF",
            boxShadow: "0px 8px 20px rgba(0,0,0,0.05)",
          }}
        >
          <Tabs
            className="orange-tabs"
            activeKey={activeTab}
            onChange={handleTabChange}
            centered
            items={[
              {
                key: "post",
                label: (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, color: activeTab === "post" ? "#C42E0A" : "#8E8E8E" }}>
                    <DescriptionIcon style={{ color: activeTab === "post" ? "#C42E0A" : "#8E8E8E" }} />
                    My Post
                  </span>
                ),
              },
              {
                key: "fav",
                label: (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, color: activeTab === "fav" ? "#C42E0A" : "#8E8E8E" }}>
                    <FavoriteIcon style={{ color: activeTab === "fav" ? "#C42E0A" : "#8E8E8E" }} />
                    My Fav
                  </span>
                ),
              },
              {
                key: "sticker",
                label: (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, color: activeTab === "sticker" ? "#C42E0A" : "#8E8E8E" }}>
                    <CrueltyFreeIcon style={{ color: activeTab === "sticker" ? "#C42E0A" : "#8E8E8E" }} />
                    My Sticker
                  </span>
                ),
              },
            ]}
          />

          <div style={{ marginTop: 20 }}>
            <Outlet />
          </div>
        </Card>
      </div>

      {/* ⭐ POPUP */}
      {isPopupOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(2px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: 700,
              maxHeight: "80vh",
              overflowY: "auto",
              background: "#FFFFFF",
              borderRadius: 20,
              padding: 30,
              boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
              position: "relative", // Ensure absolute positioning works for children
            }}
          >
            <Button
              type="text"
              onClick={() => setPopupOpen(false)}
              style={{ position: "absolute", top: 20, right: 20, fontWeight: "bold", fontSize: "16px", color: "#888" }}
            >
              X
            </Button>

            <Title level={3} style={{ color: "#C42E0A", marginTop: 10 }}>
              {profile.username}
            </Title>

            <div style={{ display: "flex", marginBottom: 25 }}>
              {["friends", "followers", "following"].map((t) => (
                <div
                  key={t}
                  onClick={() => switchPopupTab(t)}
                  style={{
                    marginRight: 40,
                    cursor: "pointer",
                    fontWeight: 700,
                    color: popupTab === t ? "#C42E0A" : "#555",
                    borderBottom: popupTab === t ? "3px solid #C42E0A" : "3px solid transparent",
                    paddingBottom: 4,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>

            {popupList.map((item, i) => {
              // Check isFollowing for Followers tab logic
              const isFollowing = followingList.some(f => f.username === item.username);

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "15px 0",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 15, cursor: "pointer" }}
                    onClick={() => confirmAction("view", item)}
                  >
                    <Avatar size={55} src={item.avatar}>
                      {item.username?.[0]}
                    </Avatar>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>{item.username}</span>
                  </div>

                  {/* ⭐ Buttons based on Tab */}
                  {popupTab === "friends" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button onClick={() => confirmAction("view", item)}>
                        View Profile
                      </Button>
                    </div>
                  )}

                  {popupTab === "followers" && (
                    <>
                      {/* If we follow them -> Show Remove Follower (as requested) */}
                      {isFollowing ? (
                        <Button
                          danger
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmAction("remove_follower", item);
                          }}
                        >
                          Remove Follower
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          style={{ background: "#C42E0A", border: "none" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmAction("follow_back", item);
                          }}
                        >
                          Follow Back
                        </Button>
                      )}
                    </>
                  )}

                  {popupTab === "following" && (
                    <Button
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmAction("unfollow", item);
                      }}
                    >
                      Unfollow
                    </Button>
                  )}
                </div>
              )
            })}

            <div style={{ textAlign: "right", marginTop: 25 }}>
              {/* Moved Close Button to Top-Right */}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Profile;
