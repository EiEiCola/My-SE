//reward
import React, { useEffect, useMemo, useState } from "react";
import { Card, Typography, Button, message, Modal, Input, Select } from "antd";
import StarsIcon from "@mui/icons-material/Stars";
import DomainVerificationIcon from "@mui/icons-material/DomainVerification";

// ✅ shop: GET /api/rewards
import { rewardShopAPI } from "../../../../services/http/reward_shop";

// ✅ redeem + my sticker + points
import { memberRewardAPI } from "../../../../services/http/member_reward";

// ✅ popup rules
import PointRuleModal from "./PointRule";

const { Title, Text } = Typography;

// -------------------- Types --------------------
type RewardItem = {
  id: number;
  name: string;
  points: number;
  image: string;
};

type MyStickerItem = {
  id: number;
  redeemed_at?: string;
  reward_id?: number;
  reward_name?: string;
  reward_picture?: string;
  point_required?: number;
  reward?: any;
  Reward?: any;
  reward_name_snapshot?: string;
  point_required_snapshot?: number;
};

// -------------------- Helpers --------------------
const pickId = (raw: any) => {
  const n = Number(
    raw?.ID ?? raw?.id ?? raw?.reward_id ?? raw?.RewardID ?? raw?.rewardID
  );
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const toNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeReward = (raw: any): RewardItem => {
  const id = pickId(raw);

  const name =
    raw?.reward_name ?? raw?.RewardName ?? raw?.name ?? raw?.rewardName ?? "";

  const points =
    raw?.point_required ??
    raw?.PointRequired ??
    raw?.points ??
    raw?.pointRequired ??
    0;

  const image =
    raw?.reward_picture ??
    raw?.RewardPicture ??
    raw?.preview ??
    raw?.imageUrl ??
    raw?.rewardPicture ??
    "";

  return {
    id,
    name: String(name),
    points: toNumber(points),
    image: String(image),
  };
};

const getStickerName = (it: MyStickerItem) => {
  const rw: any = it?.reward ?? (it as any)?.Reward;

  return (
    it?.reward_name ??
    rw?.reward_name ??
    rw?.RewardName ??
    it?.reward_name_snapshot ??
    "Sticker"
  );
};

const getStickerImg = (it: MyStickerItem) => {
  const rw: any = it?.reward ?? (it as any)?.Reward;

  return it?.reward_picture ?? rw?.reward_picture ?? rw?.RewardPicture ?? "";
};

const getStickerPoints = (it: MyStickerItem) => {
  const rw: any = it?.reward ?? (it as any)?.Reward;

  const raw =
    it?.point_required ??
    rw?.point_required ??
    rw?.PointRequired ??
    it?.point_required_snapshot ??
    rw?.point_required_snapshot ??
    rw?.PointRequiredSnapshot;

  return toNumber(raw);
};

const getRewardIdFromSticker = (it: MyStickerItem) => {
  const rw: any = it?.reward ?? (it as any)?.Reward;
  const rid = Number(it?.reward_id ?? rw?.id ?? rw?.ID ?? (it as any)?.RewardID);
  return Number.isFinite(rid) && rid > 0 ? rid : 0;
};

const parseTotalPoint = (payload: any): number => {
  try {
    const body = typeof payload === "string" ? JSON.parse(payload) : payload;

    const raw =
      body?.total_point ??
      body?.TotalPoint ??
      body?.totalPoint ??
      body?.data?.total_point ??
      body?.data?.TotalPoint ??
      body?.data?.totalPoint ??
      body?.point ??
      body?.data?.point;

    const p = Number(raw);
    return Number.isFinite(p) ? p : 0;
  } catch {
    const p = Number(payload);
    return Number.isFinite(p) ? p : 0;
  }
};

const Reward: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"shop" | "my">("shop");
  const [myPoints, setMyPoints] = useState<number>(0);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [myStickers, setMyStickers] = useState<MyStickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortPoints, setSortPoints] = useState<"asc" | "desc">("asc");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<RewardItem | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);

  const loadRewards = async () => {
    setLoading(true);
    try {
      const res = await rewardShopAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setRewards(list.map(normalizeReward));
    } catch (err: any) {
      console.log("GET /rewards error =>", err);
      message.error(err?.response?.data?.error || "โหลด Sticker Shop ไม่สำเร็จ");
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyStickers = async () => {
    try {
      const res = await memberRewardAPI.myStickers();
      const list = Array.isArray(res.data) ? res.data : [];
      setMyStickers(list);
    } catch (err: any) {
      console.log("GET /member/my-stickers error =>", err);
      setMyStickers([]);
    }
  };

  const loadMyPoints = async () => {
    try {
      const res = await memberRewardAPI.points();
      const p = parseTotalPoint(res?.data);
      setMyPoints(p);
    } catch (err: any) {
      console.log(
        "GET /member/points error =>",
        err?.response?.status,
        err?.response?.data
      );
      setMyPoints(0);
    }
  };

  useEffect(() => {
    loadRewards();
    loadMyStickers();
    loadMyPoints();
  }, []);

  const canBuy = (p: number) => myPoints >= p;

  const ownedRewardIds = useMemo(() => {
    const s = new Set<number>();
    myStickers.forEach((it) => {
      const rid = getRewardIdFromSticker(it);
      if (rid > 0) s.add(rid);
    });
    return s;
  }, [myStickers]);

  const isOwned = (rewardId: number) => ownedRewardIds.has(rewardId);

  const filteredRewards = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    const bySearch = q
      ? rewards.filter((r) => r.name.toLowerCase().includes(q))
      : rewards;

    const sorted = [...bySearch].sort((a, b) => {
      return sortPoints === "asc" ? a.points - b.points : b.points - a.points;
    });

    return sorted;
  }, [rewards, searchText, sortPoints]);

  const handleClickPurchase = (item: RewardItem) => {
    if (isOwned(item.id)) {
      message.info("คุณมีสติ๊กเกอร์นี้แล้ว ✅");
      return;
    }
    if (!canBuy(item.points)) {
      message.warning("แต้มไม่พอ");
      return;
    }
    setSelected(item);
    setConfirmOpen(true);
  };

  const confirmPurchase = async () => {
    if (!selected) return;

    try {
      const idemKey = `redeem-${selected.id}-${Date.now()}`;
      const res = await memberRewardAPI.redeem(selected.id, idemKey);

      const rawNewBal =
        res?.data?.new_point_balance ??
        res?.data?.data?.new_point_balance ??
        res?.data?.newBalance ??
        res?.data?.data?.newBalance;

      const newBal = Number(rawNewBal);
      if (Number.isFinite(newBal)) setMyPoints(newBal);

      await loadMyPoints();
      await loadMyStickers();

      message.success(`แลก ${selected.name} สำเร็จ ✅ (-${selected.points})`);
      setActiveTab("my");
    } catch (err: any) {
      console.log("redeem error =>", err);
      message.error(err?.response?.data?.error || "แลกไม่สำเร็จ");
    } finally {
      setConfirmOpen(false);
      setSelected(null);
    }
  };

  const cancelPurchase = () => {
    setConfirmOpen(false);
    setSelected(null);
  };

  return (
    <main
      style={{
        flex: 1,
        padding: 30,
        display: "flex",
        justifyContent: "center",
        // ✅ ไล่สีพื้นหลัง (Gradient) ส้มอ่อนๆ ให้ดู Premium
        background: "linear-gradient(135deg, #FFF7ED 0%, #FFEEE5 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1100 }}>
        {/* TOP POINT */}
        <Card
          style={{
            borderRadius: 24,
            marginBottom: 25,
            background: "rgba(255, 255, 255, 0.9)", // Glassy effect
            backdropFilter: "blur(10px)",
            boxShadow: "0 20px 40px rgba(255, 154, 102, 0.15)", // Orange glow shadow
            border: "1px solid rgba(255, 255, 255, 0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Title
                level={3}
                style={{
                  margin: 0,
                  background: "linear-gradient(45deg, #FF512F, #DD2476)", // Gradient Text
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                  fontSize: 32,
                  paddingLeft: 15,
                  letterSpacing: "0.5px",
                }}
              >
                My Points
              </Title>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 12,
                  gap: 12,
                  paddingLeft: 12,
                }}
              >
                <StarsIcon
                  style={{
                    color: "#FFC107",
                    fontSize: 40,
                    filter: "drop-shadow(0 2px 4px rgba(255, 193, 7, 0.3))",
                  }}
                />
                <span
                  style={{
                    fontSize: 40,
                    fontWeight: 700,
                    color: "#FFC107",
                    textShadow: "0 2px 4px rgba(255, 193, 7, 0.2)",
                  }}
                >
                  {myPoints}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Button
                onClick={() => setActiveTab("shop")}
                style={{
                  background: activeTab === "shop"
                    ? "linear-gradient(45deg, #FF512F, #DD2476)"
                    : "rgba(255, 81, 47, 0.1)", // Light orange tint when inactive
                  color: activeTab === "shop" ? "white" : "#FF512F",
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize : 15,
                  height: 44,
                  paddingLeft: 28,
                  paddingRight: 28,
                  border: "none",
                  transform: activeTab === "shop" ? "scale(1.05)" : "scale(1)",
                  boxShadow:
                    activeTab === "shop"
                      ? "0 10px 20px rgba(221, 36, 118, 0.3)"
                      : "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                Sticker Shop
              </Button>

              <Button
                onClick={() => {
                  setActiveTab("my");
                  loadMyStickers();
                  loadMyPoints();
                }}
                style={{
                  background: activeTab === "my"
                    ? "linear-gradient(45deg, #FF512F, #DD2476)"
                    : "rgba(255, 81, 47, 0.1)",
                  color: activeTab === "my" ? "white" : "#FF512F",
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize : 15,
                  height: 44,
                  paddingLeft: 28,
                  paddingRight: 28,
                  border: "none",
                  transform: activeTab === "my" ? "scale(1.05)" : "scale(1)",
                  boxShadow:
                    activeTab === "my"
                      ? "0 10px 20px rgba(221, 36, 118, 0.3)"
                      : "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                My Sticker
              </Button>
            </div>
          </div>
        </Card>

        {/* SECTION TITLE ROW */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 10,
            marginBottom: 5,
          }}
        >
          <Title
            level={4}
            style={{
              color: "#C42E0A",
              fontWeight: 700,
              fontSize: 22,
              margin: 0,
            }}
          >
            {activeTab === "shop" ? "Sticker Shop" : "My Sticker"}
          </Title>

          {activeTab === "shop" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Input
                  allowClear
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    width: 260,
                    borderRadius: 12,
                    height: 40,
                  }}
                />

                <Select
                  value={sortPoints}
                  onChange={(v) => setSortPoints(v)}
                  style={{ width: 220 }}
                  options={[
                    { value: "asc", label: "Point : น้อย -> มาก" },
                    { value: "desc", label: "Point : มาก -> น้อย" },
                  ]}
                />
              </div>

              <Button
                type="link"
                style={{
                  padding: 0,
                  height: "auto",
                  fontWeight: 600,
                  fontSize: 18,
                  color: "#C42E0A",
                }}
                onClick={() => setRuleOpen(true)}
              >
                How to earn points ?
              </Button>
            </div>
          )}
        </div>

        {/* GRID */}
        {activeTab === "shop" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 22,
              marginTop: 20,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {filteredRewards.map((it) => {
              const owned = isOwned(it.id);
              const disabled = owned || !canBuy(it.points);

              return (
                <div
                  key={it.id}
                  style={{
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-12px) scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                  }}
                >
                  <Card
                    style={{
                      borderRadius: 24,
                      background: "#FFFFFF",
                      height: 310, // Added height for better spacing
                      boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
                      border: "1px solid rgba(255, 247, 237, 1)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    bodyStyle={{
                      padding: 20,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <StarsIcon style={{ color: "#FFC107", fontSize: 26 }} />
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#FFC107",
                          fontSize: 24,
                        }}
                      >
                        {it.points}
                      </span>
                    </div>

                    <div
                      style={{
                        transition: "transform 0.3s ease",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1) rotate(5deg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                      }}
                    >
                      <img
                        src={it.image}
                        alt={it.name}
                        style={{
                          width: 110,
                          height: 110,
                          objectFit: "contain",
                          filter: owned ? "grayscale(50%)" : "none",
                          transition: "filter 0.3s ease",
                        }}
                      />
                    </div>

                    <Text
                      style={{
                        fontWeight: 700,
                        color: "#C42E0A",
                        fontSize: 18,
                        textAlign: "center",
                      }}
                    >
                      {it.name}
                    </Text>

                    <Button
                      disabled={disabled}
                      onClick={() => handleClickPurchase(it)}
                      style={{
                        background: disabled
                          ? "#e5e7eb"
                          : "linear-gradient(45deg, #FF8008, #FFC837)", // Premium Orange Gradient
                        color: disabled ? "#9ca3af" : "white",
                        borderRadius: 15,
                        height: 40,
                        padding: "0 28px",
                        border: "none",
                        fontWeight: 700,
                        fontSize: 16,
                        boxShadow: disabled
                          ? "none"
                          : "0 5px 15px rgba(255, 128, 8, 0.3)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      onMouseEnter={(e) => {
                        if (!disabled) {
                          e.currentTarget.style.transform = "scale(1.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {owned ? "Owned" : "Purchase"}
                    </Button>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 22,
              marginTop: 20,
            }}
          >
            {myStickers.length === 0 ? (
              <Card
                style={{
                  gridColumn: "1 / -1",
                  borderRadius: 20,
                  background: "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
                  border: "1px solid rgba(255, 247, 237, 1)",
                }}
              >
                <Text style={{ color: "#C42E0A", fontWeight: 600, fontSize: 16 }}>
                  ยังไม่มีสติ๊กเกอร์ที่แลกไว้
                </Text>
              </Card>
            ) : (
              myStickers.map((it) => {
                const name = getStickerName(it);
                const img = getStickerImg(it);
                const pts = getStickerPoints(it);

                return (
                  <div
                    key={it.id}
                    style={{
                      transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-12px) scale(1.02) rotate(2deg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1) rotate(0deg)";
                    }}
                  >
                    <Card
                      style={{
                        borderRadius: 24,
                        background: "#FFFFFF",
                        height: 290, // Adjusted height
                        boxShadow: "0 10px 25px rgba(0,0,0,0.06)", // Consistent premium shadow
                        border: "1px solid rgba(255, 247, 237, 1)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      bodyStyle={{
                        padding: 20,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <StarsIcon style={{ color: "#FFC107", fontSize: 26 }} />
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#FFC107",
                            fontSize: 24,
                          }}
                        >
                          {pts}
                        </span>
                      </div>

                      {img ? (
                        <div
                          style={{
                            transition: "transform 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "scale(1.15) rotate(-5deg)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                          }}
                        >
                          <img
                            src={img}
                            alt={name}
                            style={{
                              width: 115,
                              height: 115,
                              objectFit: "contain",
                              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
                            }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "https://via.placeholder.com/115?text=Sticker";
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 115,
                            height: 115,
                            border: "2px dashed #ddd",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#999",
                            fontSize: 12,
                          }}
                        >
                          No Image
                        </div>
                      )}

                      <Text
                        style={{
                          fontWeight: 700,
                          color: "#C42E0A",
                          fontSize: 18,
                          textAlign: "center",
                        }}
                      >
                        {name}
                      </Text>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 10,
                        }}
                      >
                        <DomainVerificationIcon style={{ color: "#10b981", fontSize: 22 }} />
                        <Text style={{ color: "#10b981", fontWeight: 700, margin: 0, fontSize: 16 }}>
                          Owned
                        </Text>
                      </div>
                    </Card>
                  </div>
                );
              })
            )}
          </div>
        )}

        <Modal
          open={confirmOpen}
          title="ยืนยันการแลกสติ๊กเกอร์"
          okText="ยืนยัน"
          cancelText="ยกเลิก"
          onOk={confirmPurchase}
          onCancel={cancelPurchase}
          okButtonProps={{
            style: {
              background: "linear-gradient(45deg, #FF8008, #FFC837)",
              borderColor: "transparent",
              color: "white",
              fontWeight: 700,
            },
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {selected?.image ? (
              <img
                src={selected.image}
                alt={selected.name}
                style={{ width: 60, height: 60, objectFit: "contain" }}
              />
            ) : null}

            <div>
              <div style={{ fontWeight: 700, color: "#C42E0A", fontSize: 16 }}>
                {selected?.name}
              </div>

              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <StarsIcon style={{ color: "#FFC107" }} />
                <span style={{ fontWeight: 700, color: "#FFC107" }}>
                  ใช้ {selected?.points ?? 0} แต้ม
                </span>
              </div>

              <div style={{ marginTop: 6, color: "#666", fontSize: 13 }}>
                แต้มคงเหลือหลังแลก:{" "}
                <b>{selected ? myPoints - selected.points : myPoints}</b>
              </div>
            </div>
          </div>
        </Modal>

        <PointRuleModal open={ruleOpen} onClose={() => setRuleOpen(false)} />
      </div>
    </main>
  );
};

export default Reward;
