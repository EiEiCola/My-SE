import React, { useEffect, useMemo, useState } from "react";
import { Card, Typography, message, Empty } from "antd";
import { memberRewardAPI } from "../../../../../services/http/member_reward";

const { Text } = Typography;

// -------------------- Types --------------------
type MyStickerItem = {
  id: number;
  redeemed_at?: string;

  reward_name?: string;
  reward_picture?: string;

  reward?: any;
  Reward?: any;

  reward_name_snapshot?: string;
};

// -------------------- Helpers --------------------
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

const MySticker: React.FC = () => {
  const [items, setItems] = useState<MyStickerItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await memberRewardAPI.myStickers();
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
    } catch (err) {
      console.log("GET /member/my-stickers error =>", err);
      message.error("โหลดสติ๊กเกอร์ไม่สำเร็จ");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const normalized = useMemo(() => {
    return items.map((it) => ({
      id: Number(it?.id ?? 0),
      name: getStickerName(it),
      img: getStickerImg(it),
    }));
  }, [items]);

  return (
    <Card
      style={{
        borderRadius: 18,
        background: "#ffffff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
      bodyStyle={{ padding: 18 }}
    >
      {loading ? (
        <Text style={{ color: "#999" }}>กำลังโหลด...</Text>
      ) : normalized.length === 0 ? (
        <div style={{ padding: "50px 0", display: "flex", justifyContent: "center" }}>
          <Empty description={<span style={{ color: "#999" }}> ยังไม่มีสติ๊กเกอร์ที่แลกไว้ </span>} />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 18,
          }}
        >
          {normalized.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              {s.img ? (
                <img
                  src={s.img}
                  alt={s.name}
                  style={{
                    width: 90,
                    height: 90,
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://via.placeholder.com/90?text=Sticker";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 90,
                    height: 90,
                    border: "1px dashed #ddd",
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
                  fontWeight: 600,
                  color: "#C42E0A",
                  textAlign: "center",
                }}
              >
                {s.name}
              </Text>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MySticker;
