import React, { useState, useEffect } from "react";
import { Card, Button, Typography, Avatar, Tabs } from "antd";
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

  // ✅ โหลดโปรไฟล์จาก backend ด้วย JWT: GET /api/member/me
  // ✅ โหลดโปรไฟล์จาก backend ด้วย JWT: GET /api/member/me
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, friendsRes, followersRes, followingRes] = await Promise.all([
          memberAPI.getMe(),
          friendAPI.getMyFriends(),
          friendAPI.getMyFollowers(),
          friendAPI.getMyFollowing()
        ]);

        const data = meRes.data;

        // Process Friends
        const friends = friendsRes.data ? friendsRes.data.map((f: any) => ({
          username: f.username,
          avatar: getImageUrl(f.member_picture),
          status: "friend"
        })) : [];
        setFriendList(friends);

        // Process Followers
        const followers = followersRes.data ? followersRes.data.map((f: any) => ({
          username: f.username,
          avatar: getImageUrl(f.member_picture),
          status: "follower"
        })) : [];
        setFollowerList(followers);

        // Process Following
        const following = followingRes.data ? followingRes.data.map((f: any) => ({
          username: f.username,
          avatar: getImageUrl(f.member_picture),
          status: "following"
        })) : [];
        setFollowingList(following);

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
            }}
          >
            <Title level={3} style={{ color: "#C42E0A" }}>
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

            {popupList.map((item, i) => (
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
                <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                  <Avatar size={55} src={item.avatar}>
                    {item.username[0]}
                  </Avatar>
                  <span style={{ fontSize: 17, fontWeight: 600 }}>{item.username}</span>
                </div>

                {popupTab === "followers" && (
                  <Button type="primary" style={{ background: "#C42E0A", border: "none" }}>
                    follow back
                  </Button>
                )}

                {popupTab === "following" && <Button danger>unfollow</Button>}
              </div>
            ))}

            <div style={{ textAlign: "right", marginTop: 25 }}>
              <Button onClick={() => setPopupOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Profile;
