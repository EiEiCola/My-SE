//reward
import React, { useEffect, useMemo, useState } from "react";
import { Card, Typography, Button, message, Modal } from "antd";
import StarsIcon from "@mui/icons-material/Stars";

// ✅ shop: GET /api/rewards
import { rewardShopAPI } from "../../../../services/http/reward_shop";

// ✅ redeem + my sticker + points
import { memberRewardAPI } from "../../../../services/http/member_reward";

const { Title, Text } = Typography;

// -------------------- Types --------------------
type RewardItem = {
  id: number;
  name: string;
  points: number;
  image: string;
};

type MyStickerItem = {
  id: number; // member_reward id
  redeemed_at?: string;
  reward_id?: number;

  // ✅ รองรับ response แบบใหม่ (flat)
  reward_name?: string;
  reward_picture?: string;
  point_required?: number;

  // ✅ รองรับ response แบบเก่า (nested)
  reward?: any;
  Reward?: any;

  // snapshot (เผื่อใช้)
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

// ✅ ดึงชื่อ/รูป MySticker ให้รองรับทุกแบบ (flat + nested + snapshot)
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

  return (
    it?.reward_picture ??
    rw?.reward_picture ??
    rw?.RewardPicture ??
    ""
  );
};

const getRewardIdFromSticker = (it: MyStickerItem) => {
  const rw: any = it?.reward ?? (it as any)?.Reward;
  const rid = Number(
    it?.reward_id ??
      rw?.id ??
      rw?.ID ??
      (it as any)?.RewardID
  );
  return Number.isFinite(rid) && rid > 0 ? rid : 0;
};

const Reward: React.FC = () => {
  // -------------------- State --------------------
  const [activeTab, setActiveTab] = useState<"shop" | "my">("shop");
  const [myPoints, setMyPoints] = useState<number>(0);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [myStickers, setMyStickers] = useState<MyStickerItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<RewardItem | null>(null);

  // -------------------- Load --------------------
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

  // ✅ ดึงแต้มจริงจาก backend (ต้องมี GET /member/points)
  const loadMyPoints = async () => {
    try {
      const res = await memberRewardAPI.points();
      const p = Number(res?.data?.total_point);
      if (Number.isFinite(p)) setMyPoints(p);
    } catch (err) {
      // เงียบไว้ได้
    }
  };

  useEffect(() => {
    loadRewards();
    loadMyStickers();
    loadMyPoints(); // ✅ sync แต้มจาก DB ตอนเปิดหน้า
  }, []);

  // -------------------- Derived --------------------
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

  // -------------------- Action --------------------
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

      // ✅ อัปเดตแต้มจาก response ก่อน (ไว)
      const newBal = Number(res?.data?.new_point_balance);
      if (Number.isFinite(newBal)) setMyPoints(newBal);

      // ✅ sync กับ DB อีกรอบ (กันค้าง/กันผิด)
      await loadMyPoints();

      // ✅ โหลด My Sticker ใหม่ทันที
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

  // -------------------- UI --------------------
  return (
    <main
      style={{
        flex: 1,
        padding: 30,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1100 }}>
        {/* TOP POINT */}
        <Card
          style={{
            borderRadius: 20,
            marginBottom: 25,
            background: "#ffffff",
            boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
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
                  color: "#C42E0A",
                  fontWeight: 700,
                  fontSize: 25,
                  paddingLeft: 15,
                }}
              >
                My Points
              </Title>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 10,
                  gap: 10,
                  paddingLeft: 12,
                }}
              >
                <StarsIcon style={{ color: "#FFC107", fontSize: 34 }} />
                <span
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    color: "#FFC107",
                  }}
                >
                  {myPoints}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 12 }}>
              <Button
                onClick={() => setActiveTab("shop")}
                style={{
                  backgroundColor: "#C42E0A",
                  color: "white",
                  borderRadius: 10,
                  fontWeight: 700,
                  opacity: activeTab === "shop" ? 1 : 0.6,
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
                  backgroundColor: "#C42E0A",
                  color: "white",
                  borderRadius: 10,
                  fontWeight: 700,
                  opacity: activeTab === "my" ? 1 : 0.6,
                }}
              >
                My Sticker
              </Button>
            </div>
          </div>
        </Card>

        {/* SECTION TITLE */}
        <Title
          level={4}
          style={{
            color: "#C42E0A",
            fontWeight: 700,
            fontSize: 20,
            marginTop: 10,
            marginBottom: 5,
          }}
        >
          {activeTab === "shop" ? "Sticker Shop" : "My Sticker"}
        </Title>

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
            {rewards.map((it) => {
              const owned = isOwned(it.id);
              const disabled = owned || !canBuy(it.points);

              return (
                <Card
                  key={it.id}
                  style={{
                    borderRadius: 18,
                    background: "#ffffff",
                    height: 280,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    opacity: owned ? 0.95 : 1,
                  }}
                  bodyStyle={{
                    padding: 18,
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

                  <img
                    src={it.image}
                    alt={it.name}
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "contain",
                    }}
                  />

                  <Text
                    style={{
                      fontWeight: 600,
                      color: "#C42E0A",
                      fontSize: 18,
                    }}
                  >
                    {it.name}
                  </Text>

                  <Button
                    disabled={disabled}
                    onClick={() => handleClickPurchase(it)}
                    style={{
                      backgroundColor: "#c42e0a",
                      color: "white",
                      borderRadius: 10,
                      height: 30,
                      padding: "0 18px",
                      opacity: disabled ? 0.5 : 1,
                      border: "none",
                      fontWeight: 700,
                    }}
                  >
                    {owned ? "Owned" : "Purchase"}
                  </Button>
                </Card>
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
                  borderRadius: 18,
                  background: "#ffffff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <Text style={{ color: "#C42E0A", fontWeight: 600 }}>
                  ยังไม่มีสติ๊กเกอร์ที่แลกไว้
                </Text>
              </Card>
            ) : (
              myStickers.map((it) => {
                const name = getStickerName(it);
                const img = getStickerImg(it);

                return (
                  <Card
                    key={it.id}
                    style={{
                      borderRadius: 18,
                      background: "#ffffff",
                      height: 260,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                    bodyStyle={{
                      padding: 18,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* ✅ ถ้ารูปไม่มา จะโชว์ placeholder เล็กๆ แทน ไม่ทำให้การ์ดโล่ง */}
                    {img ? (
                      <img
                        src={img}
                        alt={name}
                        style={{
                          width: 110,
                          height: 110,
                          objectFit: "contain",
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://via.placeholder.com/110?text=Sticker";
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 110,
                          height: 110,
                          border: "1px dashed #ddd",
                          borderRadius: 10,
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
                      }}
                    >
                      {name}
                    </Text>

                    <Text style={{ color: "#999" }}>Owned ✅</Text>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ✅ CONFIRM POPUP */}
        <Modal
          open={confirmOpen}
          title="ยืนยันการแลกสติ๊กเกอร์"
          okText="ยืนยัน"
          cancelText="ยกเลิก"
          onOk={confirmPurchase}
          onCancel={cancelPurchase}
          okButtonProps={{
            style: { backgroundColor: "#C42E0A", borderColor: "#C42E0A" },
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
      </div>
    </main>
  );
};

export default Reward;
