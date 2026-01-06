import React, { useEffect, useMemo, useState } from "react";
import { Card, Button, Typography, Avatar, Tabs, Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";

// ⭐ Icons
import CakeIcon from "@mui/icons-material/Cake";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EditIcon from "@mui/icons-material/Edit";

// ⭐ ICONS FOR TABS
import DescriptionIcon from "@mui/icons-material/Description";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CrueltyFreeIcon from "@mui/icons-material/CrueltyFree";

// ✅ use separated API (ของเนย)
import { memberAPI } from "../../../../../services/http/member_profile";

// ✅ tabs components (ของเนยมีอยู่แล้ว)
import MyPost from "../MyPost";
import MyFav from "../MyFav";
import MySticker from "../MySticker";

const { Title, Text } = Typography;

// 🔧 ชั่วคราว: เปลี่ยนทีหลังเป็น auth
const MY_ACCOUNT_ID = 201;

function ProfileView() {
  const navigate = useNavigate();
  const { memberId } = useParams();

  const targetId = useMemo(() => {
    if (!memberId) return MY_ACCOUNT_ID;
    const n = Number(memberId);
    return Number.isFinite(n) ? n : MY_ACCOUNT_ID;
  }, [memberId]);

  const isMe = targetId === MY_ACCOUNT_ID;

  const [activeTab, setActiveTab] = useState("post");

  const [loading, setLoading] = useState(true);
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

  // ⭐ mock friend/ follow data (รอระบบเพื่อนของเพื่อน)
  const friendList = [
    { username: "butter", avatar: "", status: "friend" },
    { username: "nirachahaha", avatar: "", status: "friend" },
  ];
  const followerList = [
    { username: "tanza", avatar: "", status: "follower" },
    { username: "ussusu", avatar: "", status: "follower" },
  ];
  const followingList = [
    { username: "tawanza", avatar: "", status: "following" },
    { username: "deereiei", avatar: "", status: "following" },
  ];

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        if (isMe) {
          const res = await memberAPI.getMe();
          const data = res.data;

          let genderText: string = data.gender || "";
          if (!genderText) {
            if (data.gender_id === 1) genderText = "Male";
            else if (data.gender_id === 2) genderText = "Female";
            else if (data.gender_id === 3) genderText = "Other";
          }

          if (!mounted) return;
          setProfile({
            username: data.username || "",
            friends: 0,
            followers: 0,
            following: 0,
            bio: data.bio || "",
            gender: genderText,
            dob: data.dob || "",
            avatar: data.member_picture || "",
          });
        } else {
          if (!mounted) return;
          setProfile({
            username: `friend_${targetId}`,
            friends: 0,
            followers: 0,
            following: 0,
            bio: "Friend profile (coming soon)\nHello from SUT",
            gender: "—",
            dob: "—",
            avatar: "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        if (!mounted) return;
        setProfile({
          username: isMe ? "my_username" : `friend_${targetId}`,
          friends: 0,
          followers: 0,
          following: 0,
          bio: "Hello World from SUT",
          gender: "Female",
          dob: "2003-12-08",
          avatar: "",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [targetId, isMe]);

  const openPopup = (type: string) => {
    setPopupTab(type);
    setPopupOpen(true);
    if (type === "friends") setPopupList(friendList);
    if (type === "followers") setPopupList(followerList);
    if (type === "following") setPopupList(followingList);
  };

  const switchPopupTab = (key: string) => {
    setPopupTab(key);
    if (key === "friends") setPopupList(friendList);
    if (key === "followers") setPopupList(followerList);
    if (key === "following") setPopupList(followingList);
  };

  const handleTabChange = (key: string) => setActiveTab(key);

  const statBoxStyle: React.CSSProperties = {
    minWidth: 120,
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none",
  };

  const statLabelStyle: React.CSSProperties = {
    fontWeight: 500,
    color: "#5c5c5c",
    whiteSpace: "nowrap",
    display: "inline-block",
  };

  if (loading) {
    return (
      <main style={{ flex: 1, padding: "40px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1100 }}>
          <Card style={{ borderRadius: 28, padding: 30 }}>
            <Spin />
          </Card>
        </div>
      </main>
    );
  }

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
          {/* content row */}
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Avatar
              size={150}
              src={profile.avatar || undefined}
              style={{
                backgroundColor: "#C42E0A",
                fontSize: 40,
                fontWeight: 700,
                flex: "0 0 auto",
              }}
            >
              {profile.username?.[0]?.toUpperCase() || "U"}
            </Avatar>

            <div style={{ flex: 1, marginLeft: 40, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
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

                {/* ✅ Edit เฉพาะเรา */}
                {isMe && (
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate("/User/Profile/EditProfile")}
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
                )}
              </div>

              {/* stats */}
              <div style={{ display: "flex", gap: 90, marginTop: 15, flexWrap: "wrap" }}>
                <div style={statBoxStyle} onClick={() => openPopup("friends")}>
                  <Title level={4} style={{ margin: 0, color: "black", fontWeight: 700 }}>
                    {profile.friends}
                  </Title>
                  <Text style={statLabelStyle}>friends</Text>
                </div>

                <div style={statBoxStyle} onClick={() => openPopup("followers")}>
                  <Title level={4} style={{ margin: 0, color: "black", fontWeight: 700 }}>
                    {profile.followers}
                  </Title>
                  <Text style={statLabelStyle}>followers</Text>
                </div>

                <div style={statBoxStyle} onClick={() => openPopup("following")}>
                  <Title level={4} style={{ margin: 0, color: "black", fontWeight: 700 }}>
                    {profile.following}
                  </Title>
                  <Text style={statLabelStyle}>following</Text>
                </div>
              </div>

              {/* bio + meta */}
              <div style={{ marginTop: 18 }}>
                <Text style={{ whiteSpace: "pre-line", fontSize: 16, fontWeight: 400 }}>
                  {profile.bio}
                </Text>

                {/* gender/dob อยู่ที่เดิม */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: 14,
                    color: "#C42E0A",
                    fontSize: 16,
                    fontWeight: 600,
                    gap: 16,
                    flexWrap: "wrap",
                    justifyContent: "flex-start",
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
          </div>

          {/* ✅ FRIEND ACTIONS: อยู่ "ใน Card แรก" และอยู่กลางเหมือนแท็บ */}
          {!isMe && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginTop: 40,
              }}
            >
              <Button
                size="middle"
                style={{
                  borderColor: "#C42E0A",
                  color: "#C42E0A",
                  fontWeight: 600,
                  height: 34,
                  padding: "0 14px",
                }}
              >
                Add Friend
              </Button>

              <Button
                size="middle"
                type="primary"
                style={{
                  backgroundColor: "#9c2510",
                  borderColor: "#9c2510",
                  fontWeight: 600,
                  height: 34,
                  padding: "0 16px",
                }}
              >
                Follow
              </Button>

            </div>
          )}
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
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      color: activeTab === "post" ? "#C42E0A" : "#8E8E8E",
                    }}
                  >
                    <DescriptionIcon style={{ color: activeTab === "post" ? "#C42E0A" : "#8E8E8E" }} />
                    {isMe ? "My Post" : "Post"}
                  </span>
                ),
                children: <MyPost />,
              },
              {
                key: "fav",
                label: (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      color: activeTab === "fav" ? "#C42E0A" : "#8E8E8E",
                    }}
                  >
                    <FavoriteIcon style={{ color: activeTab === "fav" ? "#C42E0A" : "#8E8E8E" }} />
                    {isMe ? "My Fav" : "Fav"}
                  </span>
                ),
                children: <MyFav />,
              },
              {
                key: "sticker",
                label: (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      color: activeTab === "sticker" ? "#C42E0A" : "#8E8E8E",
                    }}
                  >
                    <CrueltyFreeIcon style={{ color: activeTab === "sticker" ? "#C42E0A" : "#8E8E8E" }} />
                    {isMe ? "My Sticker" : "Sticker"}
                  </span>
                ),
                children: <MySticker />,
              },
            ]}
          />
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
                    whiteSpace: "nowrap",
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
                  <Avatar size={55} src={item.avatar || undefined}>
                    {item.username?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                  <span style={{ fontSize: 17, fontWeight: 600 }}>{item.username}</span>
                </div>

                {popupTab === "followers" && (
                  <Button type="primary" style={{ background: "#C42E0A", border: "none" }}>
                    follow back
                  </Button>
                )}

                {popupTab === "following" && (
                  <Button >
                    unfollow
                  </Button>
                )}
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

export default ProfileView;
