import React, { useEffect, useMemo, useState } from "react";
import { message, Card, Row, Col, Statistic } from "antd"; // Import message toast
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import "./AdminPollList.css";
import { adminPollAPI } from "../../../../services/http/admin_poll";
import { type Poll, categoryAPI } from "../../../../services/http/poll";

type StatusName =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "CLOSED"
  | "OPEN"
  | "UPCOMING"
  | "UNKNOWN";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const toFullUrl = (u?: string) => {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("data:") ||
    s.startsWith("blob:")
  )
    return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
};

const StatusBadge = ({ status }: { status: StatusName }) => {
  const cls =
    status === "PENDING_REVIEW"
      ? "badge badge-pending"
      : status === "PUBLISHED" || status === "OPEN" || status === "UPCOMING"
        ? "badge badge-published"
        : status === "REJECTED"
          ? "badge badge-rejected"
          : status === "CLOSED"
            ? "badge badge-closed"
            : status === "DRAFT"
              ? "badge badge-draft"
              : "badge";
  return <span className={cls}>{status}</span>;
};

/* ======================
   Helpers (อยู่นอก component ได้)
====================== */
const getId = (p: Poll) => Number((p as any).ID ?? (p as any).id ?? 0);
const getQuestion = (p: Poll) => (p as any).question ?? "";
const getDescription = (p: Poll) =>
  (p as any).description ?? (p as any).Description ?? "";
const getAuthorId = (p: Poll) => (p as any).member_id ?? (p as any).MemberID ?? "-";
const getCreatedAt = (p: Poll) => (p as any).created_at ?? (p as any).CreatedAt ?? null;
const getUpdatedAt = (p: Poll) => (p as any).updated_at ?? (p as any).UpdatedAt ?? null;

const getBaseStatus = (p: Poll): StatusName => {
  const name =
    ((p as any)?.status_name as StatusName | undefined) ??
    ((p as any)?.StatusName as StatusName | undefined) ??
    ((p as any)?.poll_status?.name as StatusName | undefined);

  if (name) return name;

  const sid =
    (p as any)?.status_id ??
    (p as any)?.poll_status_id ??
    (p as any)?.StatusID ??
    (p as any)?.PollStatusID;

  switch (Number(sid)) {
    case 1:
      return "DRAFT";
    case 2:
      return "PENDING_REVIEW";
    case 3:
      return "PUBLISHED";
    case 4:
      return "REJECTED";
    case 5:
      return "CLOSED";
    default:
      return "UNKNOWN";
  }
};

const getComputedStatus = (p: Poll): "OPEN" | "UPCOMING" | "CLOSED" | "" => {
  const csRaw =
    (p as any)?.computed_status ??
    (p as any)?.computedStatus ??
    (p as any)?.ComputedStatus ??
    "";
  const cs = String(csRaw || "").toUpperCase();
  if (cs === "OPEN" || cs === "UPCOMING" || cs === "CLOSED") return cs as any;
  return "";
};

const getDisplayStatus = (p: Poll): StatusName => {
  const base = getBaseStatus(p);
  if (base !== "PUBLISHED") return base;

  const cs = getComputedStatus(p);
  if (cs === "CLOSED") return "CLOSED";
  if (cs === "UPCOMING") return "UPCOMING";
  if (cs === "OPEN") return "OPEN";
  return "PUBLISHED";
};

const getAllowMultiple = (p: Poll) =>
  Boolean((p as any)?.allow_multiple ?? (p as any)?.AllowMultiple ?? false);

const getMaxChoice = (p: Poll) => (p as any)?.max_choice ?? (p as any)?.MaxChoice ?? null;
const getStartAt = (p: Poll) => (p as any)?.start_at ?? (p as any)?.StartAt ?? null;
const getEndAt = (p: Poll) => (p as any)?.end_at ?? (p as any)?.EndAt ?? null;

const asBool = (v: any) => {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v == null) return false;
  const s = String(v).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no" || s === "") return false;
  return Boolean(v);
};

const getIsAnonymous = (p: Poll) =>
  asBool((p as any)?.is_anonymous ?? (p as any)?.IsAnonymous ?? (p as any)?.isAnonymous ?? false);

const getMemberObj = (p: Poll) => (p as any)?.member ?? (p as any)?.Member ?? null;

const getAuthorName = (p: Poll) => {
  const m = getMemberObj(p);
  return m?.name ?? m?.full_name ?? m?.fullName ?? (p as any)?.author_name ?? "";
};

const getAuthorUsername = (p: Poll) => {
  const m = getMemberObj(p);
  return m?.username ?? m?.user_name ?? m?.userName ?? "";
};

const getAuthorAvatar = (p: Poll) => {
  const m = getMemberObj(p);
  const url =
    (p as any)?.author_avatar_url ??
    (p as any)?.AuthorAvatarURL ??
    m?.member_picture ??
    m?.MemberPicture ??
    m?.avatar_url ??
    m?.AvatarURL ??
    "";
  return toFullUrl(url);
};

const getMainCategory = (p: Poll) =>
  (p as any)?.main_category?.title ??
  (p as any)?.main_category?.name ??
  (p as any)?.MainCategory?.Title ??
  (p as any)?.MainCategory?.Name ??
  (p as any)?.main_category_title ??
  (p as any)?.MainCategoryTitle ??
  "";

const getSub1Category = (p: Poll) =>
  (p as any)?.sub_category_l1?.title ??
  (p as any)?.sub_category_l1?.name ??
  (p as any)?.SubCategoryL1?.Title ??
  (p as any)?.SubCategoryL1?.Name ??
  (p as any)?.sub_category_l1_title ??
  (p as any)?.SubCategoryL1Title ??
  "";

const getSub2Category = (p: Poll) =>
  (p as any)?.sub_category_l2?.title ??
  (p as any)?.sub_category_l2?.name ??
  (p as any)?.SubCategoryL2?.Title ??
  (p as any)?.SubCategoryL2?.Name ??
  (p as any)?.sub_category_l2_title ??
  (p as any)?.SubCategoryL2Title ??
  "";

const getRejectReason = (p: Poll) =>
  (p as any)?.last_reject_reason ?? (p as any)?.LastRejectReason ?? (p as any)?.lastRejectReason ?? "";

const getDeletedAt = (p: Poll) => (p as any)?.deleted_at ?? (p as any)?.DeletedAt ?? null;
const getDeletedByType = (p: Poll) => (p as any)?.deleted_by_type ?? (p as any)?.DeletedByType ?? "";
const getAdminDeleteReason = (p: Poll) =>
  (p as any)?.admin_delete_reason ?? (p as any)?.AdminDeleteReason ?? (p as any)?.adminDeleteReason ?? "";
const getAdminCloseReason = (p: Poll) =>
  (p as any)?.admin_close_reason ?? (p as any)?.AdminCloseReason ?? (p as any)?.closeReason ?? "";
const isDeleted = (p: Poll) => {
  const deletedAt = getDeletedAt(p);
  if (!deletedAt) return false;
  const dateStr = String(deletedAt);
  if (dateStr.startsWith("0001-01-01")) return false;
  return true;
};

const getOptions = (p: Poll) => (((p as any).poll_options || (p as any).options || []) as any[]);
const optionLabel = (opt: any) =>
  opt?.label ?? opt?.text ?? opt?.title ?? opt?.option_text ?? opt?.OptionText ?? opt?.name ?? "-";

/* ======================
   Component
====================== */
const AdminPollList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [q, setQ] = useState("");

  // Detail Modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  // Reject Modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectPollId, setRejectPollId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Close Modal
  const [closeOpen, setCloseOpen] = useState(false);
  const [closePollId, setClosePollId] = useState<number | null>(null);
  const [closeReason, setCloseReason] = useState("");

  // Delete Modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePollId, setDeletePollId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedTypeFilter, setDeletedTypeFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("latest");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [mainCategories, setMainCategories] = useState<any[]>([]);

  // Lightbox
  const [imgOpen, setImgOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");
  const openImg = (src: string) => {
    if (!src) return;
    setImgSrc(src);
    setImgOpen(true);
  };
  const closeImg = () => {
    setImgOpen(false);
    setImgSrc("");
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedPoll(null);
    closeImg();
  };

  const resetFilters = () => {
    setQ("");
    setStatusFilter("all");
    setShowDeleted(false);
    setDeletedTypeFilter("all");
    setSortOrder("latest");
    setCategoryFilter("all");
  };

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const res = await adminPollAPI.list(); // Fetch all
      setPolls(res.data || []);
    } catch (err) {
      console.error("Failed to fetch polls:", err);
      message.error("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
    // fetch categories
    categoryAPI.listMain().then((res) => {
      setMainCategories(res || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    let result = polls;

    // 1) ซ่อน DRAFT
    result = result.filter((p) => getBaseStatus(p) !== "DRAFT");

    // 2) status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => {
        const display = getDisplayStatus(p);
        if (statusFilter === "pending") return display === "PENDING_REVIEW";
        if (statusFilter === "published")
          return display === "OPEN" || display === "UPCOMING" || display === "PUBLISHED";
        if (statusFilter === "closed") return display === "CLOSED";
        if (statusFilter === "rejected") return display === "REJECTED";
        return true;
      });
    }

    // 3) deleted filter
    if (!showDeleted) {
      result = result.filter((p) => !isDeleted(p));
    } else {
      if (deletedTypeFilter === "admin") {
        result = result.filter((p) => isDeleted(p) && getDeletedByType(p) === "ADMIN");
      } else if (deletedTypeFilter === "user") {
        result = result.filter((p) => isDeleted(p) && getDeletedByType(p) === "OWNER");
      }
    }

    // 4) category filter
    if (categoryFilter !== "all") {
      const catId = Number(categoryFilter);
      result = result.filter((p) => {
        const pMainId = (p as any)?.main_category_id ?? (p as any)?.MainCategoryID ?? 0;
        return Number(pMainId) === catId;
      });
    }

    // 5) search
    if (keyword) {
      result = result.filter((p) => {
        const question = String(getQuestion(p)).toLowerCase();
        const author = String(getAuthorId(p));
        const idStr = String(getId(p));
        return question.includes(keyword) || author.includes(keyword) || idStr.includes(keyword);
      });
    }

    // 6) sort
    result = [...result].sort((a, b) => {
      const aDate = new Date(getCreatedAt(a) || 0).getTime();
      const bDate = new Date(getCreatedAt(b) || 0).getTime();

      if (sortOrder === "latest") {
        return bDate - aDate; // ใหม่ไปเก่า
      } else if (sortOrder === "oldest") {
        return aDate - bDate; // เก่าไปใหม่
      }
      return 0;
    });

    return result;
  }, [polls, q, statusFilter, showDeleted, deletedTypeFilter, sortOrder, categoryFilter]);

  const stats = useMemo(() => {
    const all = polls;
    const count = (s: StatusName) => all.filter((p) => getDisplayStatus(p) === s).length;

    const publishedLike = all.filter((p) => {
      const ds = getDisplayStatus(p);
      return ds === "OPEN" || ds === "UPCOMING" || ds === "PUBLISHED";
    }).length;

    return {
      total: all.length,
      pending: count("PENDING_REVIEW"),
      published: publishedLike,
      rejected: count("REJECTED"),
      closed: count("CLOSED"),
      draft: count("DRAFT"),
    };
  }, [polls]);

  /* Confimation Modal State */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const [confirmDanger, setConfirmDanger] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState<(() => Promise<void>) | null>(null);

  const [messageApi, contextHolder] = message.useMessage();

  const openConfirm = (
    title: string,
    desc: string,
    danger: boolean,
    onYes: () => Promise<void>
  ) => {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    setConfirmDanger(danger);
    setConfirmCallback(() => onYes);
    setConfirmOpen(true);
  };

  const handleConfirmYes = async () => {
    if (confirmCallback) {
      await confirmCallback();
    }
    setConfirmOpen(false);
    setConfirmCallback(null);
  };

  const approve = (id: number) => {
    openConfirm(
      "อนุมัติโพลนี้ใช่หรือไม่?",
      "โพลจะถูกเผยแพร่ทันทีและผู้ใช้สามารถเข้ามาโหวตได้",
      false,
      async () => {
        try {
          await adminPollAPI.approve(id);
          messageApi.success("อนุมัติโพลสำเร็จ");
          await fetchPolls();
        } catch {
          messageApi.error("บันทึกไม่สำเร็จ");
        }
      });
  };

  const openReject = (id: number) => {
    setRejectPollId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const submitReject = async () => {
    if (!rejectPollId) return;
    if (!rejectReason.trim()) return messageApi.error("กรุณาระบุเหตุผล");

    try {
      await adminPollAPI.reject(rejectPollId, rejectReason.trim());
      messageApi.success("ปฏิเสธโพลสำเร็จ");
      setRejectOpen(false);
      await fetchPolls();
      if (selectedPoll && getId(selectedPoll) === rejectPollId) closeDetail();
    } catch {
      messageApi.error("บันทึกไม่สำเร็จ");
    }
  };

  const canApproveReject = (p: Poll) => getBaseStatus(p) === "PENDING_REVIEW";

  const canClose = (p: Poll) => {
    const base = getBaseStatus(p);
    const ds = getDisplayStatus(p);
    return base === "PUBLISHED" && (ds === "OPEN" || ds === "UPCOMING");
  };

  const canDelete = (p: Poll) => {
    const s = getDisplayStatus(p);
    return s === "REJECTED" || s === "CLOSED" || s === "DRAFT";
  };

  const openClose = (id: number) => {
    setClosePollId(id);
    setCloseReason("");
    setCloseOpen(true);
  };

  const submitClose = async () => {
    if (!closePollId) return;
    if (!closeReason.trim()) return messageApi.error("กรุณาระบุเหตุผล");

    try {
      await adminPollAPI.close(closePollId, closeReason.trim());
      messageApi.success("ปิดโพลสำเร็จ");
      setCloseOpen(false);
      await fetchPolls();
      if (selectedPoll && getId(selectedPoll) === closePollId) closeDetail();
    } catch {
      messageApi.error("บันทึกไม่สำเร็จ");
    }
  };

  const openDelete = (id: number) => {
    setDeletePollId(id);
    setDeleteReason("");
    setDeleteOpen(true);
  };

  const submitDelete = async () => {
    if (!deletePollId) return;
    if (!deleteReason.trim()) return messageApi.error("กรุณาระบุเหตุผล");

    try {
      await adminPollAPI.delete(deletePollId, deleteReason.trim());
      messageApi.success("ลบโพลสำเร็จ");
      setDeleteOpen(false);
      await fetchPolls();
      if (selectedPoll && getId(selectedPoll) === deletePollId) closeDetail();
    } catch {
      messageApi.error("ลบไม่สำเร็จ");
    }
  };

  const openDetail = (p: Poll) => {
    setSelectedPoll(p);
    setDetailOpen(true);
  };

  const formatDT = (d: any) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-");

  return (
    <div className="poll-admin-page">
      {contextHolder}
      {/* HERO */}
      <div className="poll-admin-hero">
        <div>
          <div className="title">จัดการโพล</div>
          <div className="subtitle">ตรวจสอบและจัดการโพลทั้งหมด</div>
        </div>
      </div>

      {/* STATS */}
      <Row gutter={[24, 24]} justify="center" style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={4}>
          <Card bordered={false} className="transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden group rounded-xl border-0">
            <div className="relative z-10">
              <Statistic
                title={<span className="text-blue-100 text-sm font-medium">ทั้งหมด</span>}
                value={stats.total}
                valueStyle={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              />
            </div>
            <FileTextOutlined className="absolute -right-6 -bottom-6 text-[80px] text-white opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card bordered={false} className="transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 relative overflow-hidden group rounded-xl border-0">
            <div className="relative z-10">
              <Statistic
                title={<span className="text-orange-100 text-sm font-medium">รอตรวจสอบ</span>}
                value={stats.pending}
                valueStyle={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              />
            </div>
            <ClockCircleOutlined className="absolute -right-6 -bottom-6 text-[80px] text-white opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card bordered={false} className="transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br from-emerald-500 to-green-600 relative overflow-hidden group rounded-xl border-0">
            <div className="relative z-10">
              <Statistic
                title={<span className="text-green-100 text-sm font-medium">เผยแพร่แล้ว</span>}
                value={stats.published}
                valueStyle={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              />
            </div>
            <CheckCircleOutlined className="absolute -right-6 -bottom-6 text-[80px] text-white opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card bordered={false} className="transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br from-red-500 to-rose-600 relative overflow-hidden group rounded-xl border-0">
            <div className="relative z-10">
              <Statistic
                title={<span className="text-red-100 text-sm font-medium">ปฏิเสธ</span>}
                value={stats.rejected}
                valueStyle={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              />
            </div>
            <CloseCircleOutlined className="absolute -right-6 -bottom-6 text-[80px] text-white opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card bordered={false} className="transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl bg-gradient-to-br from-slate-500 to-slate-600 relative overflow-hidden group rounded-xl border-0">
            <div className="relative z-10">
              <Statistic
                title={<span className="text-slate-100 text-sm font-medium">ปิดแล้ว</span>}
                value={stats.closed}
                valueStyle={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              />
            </div>
            <StopOutlined className="absolute -right-6 -bottom-6 text-[80px] text-white opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12" />
          </Card>
        </Col>
      </Row>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <div className="searchbox">
          <span className="search-ico">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาด้วยคำถาม, ID ผู้สร้าง, ID โพล..."
          />
        </div>

        <div className="filter">
          <span>สถานะ</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">ทั้งหมด</option>
            <option value="pending">รอตรวจสอบ</option>
            <option value="published">เผยแพร่แล้ว</option>
            <option value="closed">ปิดแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>
        </div>

        <div className="filter">
          <span>หมวดหมู่</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">ทั้งหมด</option>
            {mainCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="filter" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
            />
            <span>แสดงที่ถูกลบ</span>
          </label>

          {showDeleted && (
            <select value={deletedTypeFilter} onChange={(e) => setDeletedTypeFilter(e.target.value)}>
              <option value="all">ลบทั้งหมด</option>
              <option value="admin">แอดมินลบ</option>
              <option value="user">ผู้ใช้ลบ</option>
            </select>
          )}
        </div>

        <div className="filter">
          <span>เรียงตาม</span>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="latest">ล่าสุด</option>
            <option value="oldest">เก่าสุด</option>
          </select>
        </div>

        <button
          className="btn btn-outline"
          onClick={resetFilters}
          style={{ flexShrink: 0 }}
        >
          🔄 รีเซ็ต
        </button>
      </div>

      {/* TABLE */}
      <div className="table-card">
        <div className="table-head">
          <div className="table-title">โพล</div>
          {loading ? <div className="loading">กำลังโหลด...</div> : null}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>ID</th>
                <th style={{ width: 220 }}>ผู้สร้าง</th>
                <th>คำถาม</th>
                <th style={{ width: 170 }}>สถานะ</th>
                <th style={{ width: 100, textAlign: "center" }}>รายงาน</th>
                <th style={{ width: 160 }}>วันที่สร้าง</th>
                <th style={{ width: 380, textAlign: "right" }}>การกระทำ</th>
              </tr>
            </thead>

            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="empty-box">📦</div>
                      <div className="empty-title">ไม่มีข้อมูล</div>
                      <div className="empty-sub">ลองเปลี่ยนตัวกรอง Status หรือสร้างโพลใหม่</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const id = getId(p);
                  const s = getDisplayStatus(p);
                  const question = getQuestion(p);
                  const authorId = getAuthorId(p);
                  const authorName = getAuthorName(p);
                  const authorUsername = getAuthorUsername(p);
                  const anon = getIsAnonymous(p);
                  const created = getCreatedAt(p);

                  const isDel = isDeleted(p);
                  const delType = getDeletedByType(p);
                  const avatar = getAuthorAvatar(p);

                  const nameForAvatar = authorName || authorUsername || "?";

                  return (
                    <tr key={id} style={isDel ? { opacity: 0.6, backgroundColor: "#fff5f5" } : undefined}>
                      <td className="mono">{id}</td>

                      <td>
                        <div className="author" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                          {/* Avatar Logic: Admins see real avatar even if anonymous */}
                          {avatar ? (
                            <img
                              src={avatar}
                              alt="avatar"
                              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1px solid #e2e8f0" }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                          ) : (
                            <div className="admin-avatar-placeholder">
                              {nameForAvatar.charAt(0)}
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span className="author-name">
                              {authorName || authorUsername ? (
                                <>
                                  {authorName || "-"}
                                  {authorUsername ? <span className="muted"> (@{authorUsername})</span> : null}
                                </>
                              ) : (
                                `Member #${authorId}`
                              )}
                            </span>
                            <span className="chip">ID {authorId}</span>
                          </div>
                        </div>
                      </td>

                      <td className="question">
                        <button className="link-btn" onClick={() => openDetail(p)} type="button">
                          {isDel ? <span style={{ textDecoration: "line-through", color: "#999" }}>{question}</span> : question}
                        </button>
                        {isDel && (
                          <div style={{ fontSize: "0.75rem", color: "#d32f2f", marginTop: 2, fontWeight: 600 }}>
                            {delType === "ADMIN" ? "🗑 Deleted by Admin" : "🗑 Deleted by Owner"}
                          </div>
                        )}
                      </td>

                      <td>
                        <StatusBadge status={s} />
                      </td>

                      <td style={{ textAlign: "center" }}>
                        {p.report_count ? (
                          <span className="chip" style={{ backgroundColor: "#fee2e2", color: "#ef4444", fontWeight: "bold" }}>
                            🚨 {p.report_count}
                          </span>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>

                      <td className="muted">
                        {created ? dayjs(created).format("DD/MM/YYYY") : "-"}
                        {getDeletedAt(p) && (
                          <div style={{ fontSize: "0.75rem", color: "#d32f2f" }}>
                            Del: {dayjs(getDeletedAt(p)).format("DD/MM/YYYY")}
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className="actions">
                          <button className="btn btn-outline" onClick={() => openDetail(p)} type="button">
                            ดูรายละเอียด
                          </button>

                          {!isDel && canApproveReject(p) && (
                            <>
                              <button className="btn btn-primary" onClick={() => approve(id)} type="button">
                                ✅ อนุมัติ
                              </button>
                              <button className="btn btn-danger" onClick={() => openReject(id)} type="button">
                                ❌ ปฏิเสธ
                              </button>
                            </>
                          )}

                          {!isDel && canClose(p) && (
                            <button className="btn btn-outline" onClick={() => openClose(id)} type="button">
                              ⛔ ปิด
                            </button>
                          )}

                          {!isDel && canDelete(p) && (
                            <button className="btn btn-ghost-danger" onClick={() => openDelete(id)} type="button">
                              🗑 ลบ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== MODALS ====== */}

      {/* Detail Modal */}
      {detailOpen && selectedPoll && (
        <div className="card-backdrop" onMouseDown={closeDetail}>
          <div className="card-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="card-head">
              <div>
                <div className="card-title">Poll Detail</div>
                <div className="card-sub">
                  ID #{getId(selectedPoll)} • {formatDT(getCreatedAt(selectedPoll))}
                </div>
              </div>
              <button className="icon-btn" onClick={closeDetail} type="button">
                ✕
              </button>
            </div>

            <div className="card-body">
              {/* REPORT BANNER */}
              {(selectedPoll.report_count || 0) > 0 && !isDeleted(selectedPoll) && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#fff7ed",
                    border: "1px solid #ffedd5",
                    borderRadius: 12,
                    color: "#9a3412",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>⚠️ ถูกรายงาน {selectedPoll.report_count} times</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                  </div>
                </div>
              )}

              {/* REJECT BANNER */}
              {getDisplayStatus(selectedPoll) === "REJECTED" && getRejectReason(selectedPoll) && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#fef2f2",
                    border: "1px solid #fee2e2",
                    borderRadius: 12,
                    color: "#b91c1c",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>❌ ถูกปฏิเสธ</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    เหตุผล: <strong>{getRejectReason(selectedPoll)}</strong>
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                    เวลา: {formatDT(getUpdatedAt(selectedPoll))}
                  </div>
                </div>
              )}

              {/* ADMIN DELETE BANNER */}
              {isDeleted(selectedPoll) && getDeletedByType(selectedPoll) === "ADMIN" && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#fef2f2",
                    border: "1px solid #fee2e2",
                    borderRadius: 12,
                    color: "#b91c1c",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>🚫 ลบโดยแอดมิน</div>
                  {getAdminDeleteReason(selectedPoll) && (
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      เหตุผล: <strong>{getAdminDeleteReason(selectedPoll)}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                    ลบเมื่อ: {formatDT(getDeletedAt(selectedPoll))}
                  </div>
                </div>
              )}

              {/* ADMIN CLOSE BANNER */}
              {getDisplayStatus(selectedPoll) === "CLOSED" && getAdminCloseReason(selectedPoll) && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#fffbeb",
                    border: "1px solid #fef3c7",
                    borderRadius: 12,
                    color: "#92400e",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>⛔ ปิดโดยแอดมิน</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    เหตุผล: <strong>{getAdminCloseReason(selectedPoll)}</strong>
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                    ปิดเมื่อ: {formatDT(getUpdatedAt(selectedPoll))}
                  </div>
                </div>
              )}

              <div className="detail-block">
                <div className="detail-label">Question</div>
                <div className="detail-value">{getQuestion(selectedPoll)}</div>
              </div>

              {getDescription(selectedPoll) && (
                <div className="detail-block">
                  <div className="detail-label">Description</div>
                  <div className="detail-value">{getDescription(selectedPoll)}</div>
                </div>
              )}

              <div className="detail-grid">
                <div className="detail-block">
                  <div className="detail-label">Author</div>
                  <div className="detail-value" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img
                      src={getAuthorAvatar(selectedPoll) || "/anon-avatar.png"}
                      alt="avatar"
                      style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", border: "1px solid #e2e8f0" }}
                      onError={(e) => (e.currentTarget.src = "/anon-avatar.png")}
                    />
                    <div>
                      <div>
                        {getAuthorName(selectedPoll) || "-"}
                        {getAuthorUsername(selectedPoll) ? <span className="muted"> (@{getAuthorUsername(selectedPoll)})</span> : ""}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                        <span className="chip">ID {getAuthorId(selectedPoll)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-block">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">
                    <StatusBadge status={getDisplayStatus(selectedPoll)} />
                  </div>
                </div>

                <div className="detail-block">
                  <div className="detail-label">Reports</div>
                  <div className="detail-value">
                    {selectedPoll.report_count ? (
                      <span className="chip" style={{ backgroundColor: "#fee2e2", color: "#ef4444", fontWeight: "bold" }}>
                        🚨 {selectedPoll.report_count} Reports
                      </span>
                    ) : (
                      "No reports"
                    )}
                  </div>
                </div>

                <div className="detail-block">
                  <div className="detail-label">Identity</div>
                  <div className="detail-value">
                    <span className="chip">{getIsAnonymous(selectedPoll) ? "ไม่เปิดเผยชื่อ" : "เปิดเผยชื่อ"}</span>
                  </div>
                </div>

                <div className="detail-block">
                  <div className="detail-label">Allow Multiple</div>
                  <div className="detail-value">{getAllowMultiple(selectedPoll) ? "Yes" : "No"}</div>
                </div>

                <div className="detail-block">
                  <div className="detail-label">Max Choice</div>
                  <div className="detail-value">{getMaxChoice(selectedPoll) ?? "-"}</div>
                </div>

                <div className="detail-block">
                  <div className="detail-label">Time Range</div>
                  <div className="detail-value muted">
                    {formatDT(getStartAt(selectedPoll))} → {formatDT(getEndAt(selectedPoll))}
                  </div>
                </div>

                {/* ✅ Category Display (Full Grid) - Moved to last */}
                <div className="detail-block">
                  <div className="detail-label">Category</div>
                  <div className="detail-value" style={{ marginTop: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px", alignItems: "center" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>หมวดหลัก:</div>
                      <div style={{ color: "#334155" }}>{getMainCategory(selectedPoll) || "-"}</div>

                      <div style={{ fontWeight: 800, color: "#0f172a" }}>หมวดย่อย 1:</div>
                      <div style={{ color: "#334155" }}>{getSub1Category(selectedPoll) || "-"}</div>

                      <div style={{ fontWeight: 800, color: "#0f172a" }}>หมวดย่อย 2:</div>
                      <div style={{ color: "#334155" }}>{getSub2Category(selectedPoll) || "-"}</div>
                    </div>
                  </div>
                </div>

                {/* ✅ Winner Display (Only if CLOSED) */}
                {getDisplayStatus(selectedPoll) === "CLOSED" && (() => {
                  const options = getOptions(selectedPoll);
                  if (options.length === 0) return null;

                  const maxVotes = Math.max(...options.map((o: any) => o?.vote_count ?? o?.VoteCount ?? o?.votes ?? 0));
                  // ถ้าไม่มีโหวตเลย (0) ก็ไม่ต้องโชว์ winner
                  if (maxVotes === 0) {
                    return (
                      <div className="detail-block" style={{ marginTop: 20, paddingTop: 20, borderTop: "1px dashed #cbd5e1" }}>
                        <div className="detail-label" style={{ color: "#64748b" }}>🏆 Winner</div>
                        <div className="detail-value" style={{ color: "#94a3b8", fontStyle: "italic" }}>
                          No votes yet
                        </div>
                      </div>
                    );
                  }

                  const winners = options.filter((o: any) => (o?.vote_count ?? o?.VoteCount ?? o?.votes ?? 0) === maxVotes);

                  return (
                    <div className="detail-block" style={{ marginTop: 20, paddingTop: 20, borderTop: "1px dashed #cbd5e1" }}>
                      <div className="detail-label" style={{ color: "#f59e0b" }}>🏆 Winner</div>
                      <div className="detail-value">
                        {winners.map((w: any, i: number) => (
                          <div key={i} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 8,
                            background: "#fffbeb",
                            padding: "12px",
                            borderRadius: "12px",
                            border: "1px solid #fcd34d"
                          }}>
                            {(w?.img_url || w?.ImgURL) ? (
                              <img
                                src={toFullUrl(w?.img_url || w?.ImgURL)}
                                alt="winner"
                                style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}
                              />
                            ) : (
                              <div style={{ width: 48, height: 48, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                                👑
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, color: "#92400e" }}>{optionLabel(w)}</div>
                              <div style={{ fontSize: 13, color: "#b45309" }}>{maxVotes} Votes</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>



              <div className="detail-block" style={{ marginTop: 10 }}>
                <div className="detail-label">
                  Options <span className="muted">({getOptions(selectedPoll).length})</span>
                </div>

                {getOptions(selectedPoll).length === 0 ? (
                  <div className="muted">No options</div>
                ) : (
                  <div className="opt-grid">
                    {/** ✅ FIX: คำนวณ totalVotes ครั้งเดียว */}
                    {(() => {
                      const options = getOptions(selectedPoll);
                      const totalVotes = options.reduce((sum: number, o: any) => {
                        return sum + (o?.vote_count ?? o?.VoteCount ?? o?.votes ?? 0);
                      }, 0);

                      return options.map((opt: any, idx: number) => {
                        const voteCount = opt?.vote_count ?? opt?.VoteCount ?? opt?.votes ?? 0;
                        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : "0.0";

                        const imgUrlRaw = opt?.img_url ?? opt?.ImgURL ?? opt?.image_url ?? "";
                        const imgUrl = toFullUrl(imgUrlRaw);
                        const hasImg = Boolean(imgUrlRaw && String(imgUrlRaw).trim());

                        return (
                          <div
                            className={`opt-item ${hasImg ? "has-img" : "no-img"}`}
                            key={opt.ID || opt.id || idx}
                          >
                            {hasImg && (
                              <button
                                className="opt-imgBtn"
                                type="button"
                                onClick={() => openImg(imgUrl)}
                                title="ดูรูปเต็ม"
                              >
                                <img
                                  className="opt-img"
                                  src={imgUrl}
                                  alt={`Option ${idx + 1}`}
                                  onError={(e) => {
                                    // ถ้ารูปเสีย ซ่อนปุ่มรูปทั้งก้อน (กัน layout พัง)
                                    const btn = (e.currentTarget.closest("button") as HTMLButtonElement | null);
                                    if (btn) btn.style.display = "none";
                                  }}
                                />
                              </button>
                            )}

                            <div className="opt-meta">
                              <div className="opt-title">ตัวเลือก {idx + 1}</div>
                              <div className="opt-text">{optionLabel(opt)}</div>

                              {!["UPCOMING", "PENDING_REVIEW"].includes(getDisplayStatus(selectedPoll)) && (
                                <div className="opt-stats">
                                  <span className="chip" style={{ fontSize: "12px", padding: "2px 8px", height: "auto" }}>
                                    🗳️ {voteCount}
                                  </span>
                                  <span className="opt-pct">({percentage}%)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              <div className="card-actions">
                {canApproveReject(selectedPoll) && (
                  <>
                    <button className="btn btn-primary" onClick={() => approve(getId(selectedPoll))} type="button">
                      ✅ Approve
                    </button>
                    <button className="btn btn-danger" onClick={() => openReject(getId(selectedPoll))} type="button">
                      ❌ Reject
                    </button>
                  </>
                )}

                {canClose(selectedPoll) && (
                  <button className="btn btn-outline" onClick={() => openClose(getId(selectedPoll))} type="button">
                    ⛔ Close
                  </button>
                )}

                {canDelete(selectedPoll) && (
                  <button className="btn btn-ghost-danger" onClick={() => openDelete(getId(selectedPoll))} type="button">
                    🗑 Delete
                  </button>
                )}

                <button className="btn btn-outline" onClick={closeDetail} type="button">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectOpen && (
        <div className="modal-backdrop" onMouseDown={() => setRejectOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-title">ปฏิเสธโพล</div>
            <div className="modal-sub">กรุณาระบุเหตุผลที่ปฏิเสธ:</div>

            <textarea
              className="modal-textarea"
              placeholder="เช่น เนื้อหาไม่เหมาะสม, ตัวเลือกไม่เพียงพอ..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              autoFocus
            />

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setRejectOpen(false)} type="button">
                ยกเลิก
              </button>
              <button className="btn btn-danger" onClick={submitReject} type="button">
                ปฏิเสธโพล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {closeOpen && (
        <div className="modal-backdrop" onMouseDown={() => setCloseOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-title">ปิดโพลบังคับ</div>
            <div className="modal-sub">กรุณาระบุเหตุผลที่ปิดโพล:</div>

            <textarea
              className="modal-textarea"
              placeholder="เช่น เนื้อหาไม่เหมาะสม, ผิดกฎระเบียบ..."
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              rows={4}
              autoFocus
            />

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setCloseOpen(false)} type="button">
                ยกเลิก
              </button>
              <button className="btn btn-warning" onClick={submitClose} type="button">
                ปิดโพล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteOpen && (
        <div className="modal-backdrop" onMouseDown={() => setDeleteOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-title">ลบโพล</div>
            <div className="modal-sub">กรุณาระบุเหตุผลที่ลบโพล:</div>

            <textarea
              className="modal-textarea"
              placeholder="เช่น สแปม, ซ้ำซ้อน, ผิดกฎการใช้งาน..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={4}
              autoFocus
            />

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteOpen(false)} type="button">
                ยกเลิก
              </button>
              <button className="btn btn-ghost-danger" onClick={submitDelete} type="button">
                ลบโพล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {imgOpen && (
        <div className="img-overlay" onMouseDown={closeImg}>
          <div className="img-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="img-close" onClick={closeImg} type="button">
              ✕
            </button>
            <img className="img-full" src={imgSrc} alt="poll option" />
          </div>
        </div>
      )}
      {/* Confirm Modal (Approve / Generic) */}
      {confirmOpen && (
        <div className="card-backdrop" onMouseDown={() => setConfirmOpen(false)}>
          <div className="card-modal" style={{ width: "min(420px, 90vw)", height: "auto" }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ padding: "32px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px", lineHeight: 1 }}>
                {confirmDanger ? "⚠️" : "✅"}
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
                {confirmTitle}
              </div>
              <div style={{ fontSize: "15px", color: "#64748b", marginBottom: "32px", lineHeight: "1.6", fontWeight: "600" }}>
                {confirmDesc}
              </div>

              <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center" }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setConfirmOpen(false)}
                  style={{ minWidth: "100px" }}
                >
                  ยกเลิก
                </button>
                <button
                  className={`btn ${confirmDanger ? "btn-danger" : "btn-primary"}`}
                  onClick={handleConfirmYes}
                  style={{ minWidth: "120px", boxShadow: confirmDanger ? "0 10px 25px rgba(239,68,68,0.25)" : "0 10px 25px rgba(59,130,246,0.3)" }}
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPollList;
