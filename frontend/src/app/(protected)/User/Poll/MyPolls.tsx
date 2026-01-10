import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "./MyPolls.css";
import { useNavigate } from "react-router-dom";
import { type Poll, pollAPI, categoryAPI } from "../../../../services/http/poll";

type StatusName =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "CLOSED"
  | "OPEN"
  | "UPCOMING"
  | "UNKNOWN";

// ====== helpers (อยู่นอก component ได้) ======
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const toFullUrl = (u?: string) => {
  if (!u) return "";
  const s = String(u ?? "").trim();
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

const optionImgUrl = (opt: any) =>
  opt?.img_url ?? opt?.ImgURL ?? opt?.image_url ?? opt?.imgUrl ?? "";

// ====== StatusBadge ======
const StatusBadge = ({ status }: { status: StatusName }) => {
  let cls = "badge";
  switch (status) {
    case "PENDING_REVIEW":
      cls = "badge badge-pending";
      break;
    case "OPEN":
      cls = "badge badge-open";
      break;
    case "UPCOMING":
      cls = "badge badge-upcoming";
      break;
    case "PUBLISHED":
      cls = "badge badge-published";
      break;
    case "REJECTED":
      cls = "badge badge-rejected";
      break;
    case "CLOSED":
      cls = "badge badge-closed";
      break;
    case "DRAFT":
      cls = "badge badge-draft";
      break;
    default:
      cls = "badge";
  }

  return <span className={cls}>{status}</span>;
};

const MyPolls: React.FC = () => {
  const navigate = useNavigate();

  // ✅ lightbox (ดูรูปใหญ่) — ต้องอยู่ใน component
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

  const [loading, setLoading] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<number>(0); // 0 = all (ของ mypoll ใช้ status_id)
  const [mainId, setMainId] = useState<number>(0);
  const [sub1Id, setSub1Id] = useState<number>(0);
  const [sub2Id, setSub2Id] = useState<number>(0);

  const [mainMap, setMainMap] = useState<Record<number, string>>({});
  const [sub1Map, setSub1Map] = useState<Record<number, string>>({});
  const [sub2Map, setSub2Map] = useState<Record<number, string>>({});

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ✅ category names (map จาก id → title) ไม่ต้องแก้ backend
  const [catNames, setCatNames] = useState<{
    main?: string;
    sub1?: string;
    sub2?: string;
  }>({});

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const [confirmDanger, setConfirmDanger] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(
    null
  );

  // -------- helpers: กัน field name ไม่ตรง --------
  const getId = (p: Poll) => Number((p as any).ID ?? (p as any).id ?? 0);
  const getQuestion = (p: Poll) => (p as any).question ?? "";
  const getCreatedAt = (p: Poll) => (p as any).created_at ?? (p as any).CreatedAt ?? null;
  const getUpdatedAt = (p: Poll) => (p as any).updated_at ?? (p as any).UpdatedAt ?? null;

  // ✅ Admin moderation helpers
  const getDeletedAt = (p: Poll) => (p as any).deleted_at ?? (p as any).DeletedAt ?? null;
  const getAdminCloseReason = (p: Poll) =>
    (p as any).admin_close_reason ?? (p as any).AdminCloseReason ?? "";
  const getAdminDeleteReason = (p: Poll) =>
    (p as any).admin_delete_reason ?? (p as any).AdminDeleteReason ?? "";
  const getDeletedByType = (p: Poll) =>
    (p as any).deleted_by_type ?? (p as any).DeletedByType ?? "";

  // ✅ เช็คว่าถูกลบโดย admin (ไม่ใช่ลบเอง)
  const isDeletedByAdmin = (p: Poll) => {
    const deletedByType = getDeletedByType(p);
    return deletedByType === "ADMIN";
  };

  const isClosedByAdmin = (p: Poll) => {
    const reason = getAdminCloseReason(p);
    return reason && reason.trim() !== "";
  };

  const getStatusId = (p: Poll) =>
    Number(
      (p as any)?.status_id ??
      (p as any)?.StatusID ??
      (p as any)?.poll_status_id ??
      (p as any)?.PollStatusID ??
      0
    ) || 0;

  const getAllowMultiple = (p: Poll) =>
    Boolean((p as any)?.allow_multiple ?? (p as any)?.AllowMultiple ?? false);

  const getMaxChoice = (p: Poll) => (p as any)?.max_choice ?? (p as any)?.MaxChoice ?? null;

  const getStartAt = (p: Poll) => (p as any)?.start_at ?? (p as any)?.StartAt ?? null;
  const getEndAt = (p: Poll) => (p as any)?.end_at ?? (p as any)?.EndAt ?? null;

  const getOptions = (p: Poll) =>
    (((p as any).poll_options || (p as any).options || []) as any[]);

  const getRejectReason = (p: Poll) =>
    (p as any)?.last_reject_reason ??
    (p as any)?.LastRejectReason ??
    (p as any)?.lastRejectReason ??
    "";

  const optionLabel = (opt: any) =>
    opt?.text ??
    opt?.title ??
    opt?.option_text ??
    opt?.optionText ??
    opt?.OptionText ??
    opt?.name ??
    opt?.label ??
    "-";

  const getIsAnonymous = (p: Poll) =>
    Boolean(
      (p as any)?.is_anonymous ??
      (p as any)?.IsAnonymous ??
      (p as any)?.isAnonymous ??
      false
    );


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

  // ✅ รวม: อ่าน computed_status จาก backend ก่อน ถ้าไม่มี → fallback คำนวณเองจากเวลา
  const getComputedStatus = (p: Poll): "OPEN" | "UPCOMING" | "CLOSED" | "" => {
    const csRaw =
      (p as any)?.computed_status ??
      (p as any)?.computedStatus ??
      (p as any)?.ComputedStatus ??
      "";

    const cs = String(csRaw || "").toUpperCase();
    if (cs === "OPEN" || cs === "UPCOMING" || cs === "CLOSED") return cs as any;

    // ---- fallback: คำนวณเอง (เผื่อ endpoint list ยังไม่ส่ง computed_status) ----
    const now = dayjs();

    const eff =
      (p as any)?.effective_start_at ??
      (p as any)?.EffectiveStartAt ??
      (p as any)?.effectiveStartAt ??
      null;

    const start = eff ?? getStartAt(p);
    const end = getEndAt(p);

    const s = start ? dayjs(start) : null;
    const e = end ? dayjs(end) : null;

    if (e && now.isAfter(e)) return "CLOSED";
    if (s && now.isBefore(s)) return "UPCOMING";
    return "OPEN";
  };

  // ✅ แสดง/นับ/กรองตาม computed สำหรับโพลที่ published แล้ว
  const getDisplayStatus = (p: Poll): StatusName => {
    const base = getBaseStatus(p);

    // ถ้า DB ปิดจริง (status_id=5) ก็ปิดเลย
    if (base === "CLOSED") return "CLOSED";

    // ใช้ computed เฉพาะตอนเป็น PUBLISHED
    if (base !== "PUBLISHED") return base;

    const cs = getComputedStatus(p);
    if (cs === "CLOSED") return "CLOSED";
    if (cs === "UPCOMING") return "UPCOMING";
    if (cs === "OPEN") return "OPEN";

    return "PUBLISHED";
  };

  // ✅ extract category ids (กัน field ชื่อไม่ตรง)
  const getMainCategoryId = (p: Poll | null) =>
    Number(
      (p as any)?.main_category_id ??
      (p as any)?.MainCategoryID ??
      (p as any)?.mainCategoryID ??
      (p as any)?.main_category?.id ??
      0
    ) || 0;

  const getSubCategoryL1Id = (p: Poll | null) =>
    Number(
      (p as any)?.sub_category_l1_id ??
      (p as any)?.SubCategoryL1ID ??
      (p as any)?.subCategoryL1ID ??
      (p as any)?.sub_category_l1?.id ??
      0
    ) || 0;

  const getSubCategoryL2Id = (p: Poll | null) =>
    Number(
      (p as any)?.sub_category_l2_id ??
      (p as any)?.SubCategoryL2ID ??
      (p as any)?.subCategoryL2ID ??
      (p as any)?.sub_category_l2?.id ??
      0
    ) || 0;

  const getCatTextFromIds = (p: Poll) => {
    const mid = getMainCategoryId(p);
    const s1 = getSubCategoryL1Id(p);
    const s2 = getSubCategoryL2Id(p);

    const t1 = mid ? (mainMap[mid] ?? "") : "";
    const t2 = s1 ? (sub1Map[s1] ?? "") : "";
    const t3 = s2 ? (sub2Map[s2] ?? "") : "";

    return `${t1} ${t2} ${t3}`.trim().toLowerCase();
  };

  // ✅ load category names เมื่อเปิด detail / หรือ selectedPoll เปลี่ยน
  useEffect(() => {
    const loadCatNames = async () => {
      try {
        const mainId = getMainCategoryId(selectedPoll);
        const sub1Id = getSubCategoryL1Id(selectedPoll);
        const sub2Id = getSubCategoryL2Id(selectedPoll);

        // ไม่มีหมวด -> เคลียร์
        if (!mainId && !sub1Id && !sub2Id) {
          setCatNames({});
          return;
        }

        let mainTitle = "";
        let sub1Title = "";
        let sub2Title = "";

        // main
        if (mainId) {
          const mains = await (categoryAPI as any).listMain();
          mainTitle =
            (mains || []).find((x: any) => Number(x?.id ?? x?.ID ?? 0) === mainId)?.title ??
            (mains || []).find((x: any) => Number(x?.id ?? x?.ID ?? 0) === mainId)?.name ??
            "";
        }

        // sub1 (ต้องมี mainId)
        if (mainId && sub1Id) {
          const sub1s = await (categoryAPI as any).listSub1(mainId);
          sub1Title =
            (sub1s || []).find((x: any) => Number(x?.id ?? x?.ID ?? 0) === sub1Id)?.title ??
            (sub1s || []).find((x: any) => Number(x?.id ?? x?.ID ?? 0) === sub1Id)?.name ??
            "";
        }

        // sub2 (ต้องมี sub1Id)
        if (sub1Id && sub2Id) {
          const sub2s = await (categoryAPI as any).listSub2(sub1Id);
          sub2Title =
            (sub2s || []).find((x: any) => Number(x?.id ?? x?.ID ?? 0) === sub2Id)?.title ??
            (sub2s || []).find((x: any) => Number(x?.id ?? x?.ID ?? 0) === sub2Id)?.name ??
            "";
        }

        setCatNames({
          main: mainTitle || undefined,
          sub1: sub1Title || undefined,
          sub2: sub2Title || undefined,
        });
      } catch (e) {
        console.error(e);
        setCatNames({});
      }
    };

    if (detailOpen && selectedPoll && !detailLoading) {
      loadCatNames();
    } else {
      // ปิด modal หรือยังโหลด detail อยู่ -> เคลียร์เพื่อไม่ให้ค้างค่าเก่า
      setCatNames({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    detailOpen,
    detailLoading,
    selectedPoll?.id,
    (selectedPoll as any)?.ID,
    (selectedPoll as any)?.main_category_id,
    (selectedPoll as any)?.MainCategoryID,
    (selectedPoll as any)?.sub_category_l1_id,
    (selectedPoll as any)?.SubCategoryL1ID,
    (selectedPoll as any)?.sub_category_l2_id,
    (selectedPoll as any)?.SubCategoryL2ID,
  ]);

  // -----------------------------------------------
  const fetchPolls = async (statusID?: number) => {
    setLoading(true);
    try {
      const res = await pollAPI.getMyPolls(statusID);
      const rows = (res as any)?.data?.data ?? (res as any)?.data ?? [];
      const list = Array.isArray(rows) ? rows : [];
      setPolls(list);

      // ✅ สร้างชุด id ที่เจอ
      const mainIds = Array.from(
        new Set(list.map((p: any) => Number(p.main_category_id ?? 0)).filter(Boolean))
      );
      const sub1Ids = Array.from(
        new Set(list.map((p: any) => Number(p.sub_category_l1_id ?? 0)).filter(Boolean))
      );
      const sub2Ids = Array.from(
        new Set(list.map((p: any) => Number(p.sub_category_l2_id ?? 0)).filter(Boolean))
      );

      // ✅ โหลด main ทั้งหมดครั้งเดียว
      if (mainIds.length) {
        const mains = await (categoryAPI as any).listMain();
        const m: Record<number, string> = {};
        (mains || []).forEach((x: any) => {
          const id = Number(x?.id ?? x?.ID ?? 0);
          if (id) m[id] = x?.title ?? x?.name ?? "";
        });
        setMainMap(m);
      }

      // ✅ โหลด sub1 ตาม main ที่มีอยู่ (วน mainIds)
      if (mainIds.length) {
        const s1: Record<number, string> = {};
        for (const mid of mainIds) {
          const sub1s = await (categoryAPI as any).listSub1(mid);
          (sub1s || []).forEach((x: any) => {
            const id = Number(x?.id ?? x?.ID ?? 0);
            if (id) s1[id] = x?.title ?? x?.name ?? "";
          });
        }
        setSub1Map(s1);
      }

      // ✅ โหลด sub2 ตาม sub1 ที่มีอยู่ (วน sub1Ids)
      if (sub1Ids.length) {
        const s2: Record<number, string> = {};
        for (const sid of sub1Ids) {
          const sub2s = await (categoryAPI as any).listSub2(sid);
          (sub2s || []).forEach((x: any) => {
            const id = Number(x?.id ?? x?.ID ?? 0);
            if (id) s2[id] = x?.title ?? x?.name ?? "";
          });
        }
        setSub2Map(s2);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load polls");
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ดึงทั้งหมดครั้งเดียว (ไม่ดึงตาม tab) แล้ว filter ใน FE
  useEffect(() => {
    fetchPolls(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const list = polls;

    const count = (s: StatusName) => list.filter((p) => getDisplayStatus(p) === s).length;

    // Published tab: รวม OPEN/UPCOMING/PUBLISHED (ไม่รวม CLOSED)
    const publishedLike = list.filter((p) => {
      const ds = getDisplayStatus(p);
      return ds === "OPEN" || ds === "UPCOMING" || ds === "PUBLISHED";
    }).length;

    return {
      total: list.length,
      draft: count("DRAFT"),
      pending: count("PENDING_REVIEW"),
      published: publishedLike,
      rejected: count("REJECTED"),
      closed: count("CLOSED"),
    };
  }, [polls]);

  const tabs = [
    { id: 0, label: "All", count: stats.total },
    { id: 1, label: "Drafts", count: stats.draft },
    { id: 2, label: "Pending", count: stats.pending },
    { id: 3, label: "Published", count: stats.published },
    { id: 4, label: "Rejected", count: stats.rejected },
    { id: 5, label: "Closed", count: stats.closed },
  ];

  // ✅✅✅ FIX: filtered (ค้นได้ทั้ง question + หมวด 3 ชั้น)
  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    // ✅ base filter ตาม tab (ใช้ displayStatus)
    let base: Poll[] = polls;

    // ✅ ซ่อนโพลที่ลบเอง (deleted_by_type = "OWNER")
    base = base.filter((p) => getDeletedByType(p) !== "OWNER");

    if (activeTab !== 0) {
      base = polls.filter((p) => {
        const ds = getDisplayStatus(p);

        // tab=Published(3): เอา OPEN/UPCOMING/PUBLISHED (ไม่รวม CLOSED)
        if (activeTab === 3) return ds === "OPEN" || ds === "UPCOMING" || ds === "PUBLISHED";

        // tab=Closed(5): เอา CLOSED
        if (activeTab === 5) return ds === "CLOSED";

        // tab อื่น ๆ: ตรงตาม base status เดิม (DB)
        const baseS = getBaseStatus(p);
        const sid =
          baseS === "DRAFT"
            ? 1
            : baseS === "PENDING_REVIEW"
              ? 2
              : baseS === "PUBLISHED"
                ? 3
                : baseS === "REJECTED"
                  ? 4
                  : baseS === "CLOSED"
                    ? 5
                    : 0;

        return sid === activeTab;
      });
    }

    // ✅ filter ตาม status dropdown (0 = all)
    if (status) base = base.filter((p) => getStatusId(p) === status);

    // ✅ filter 3-level category (0 = all)
    if (mainId) base = base.filter((p) => getMainCategoryId(p) === mainId);
    if (sub1Id) base = base.filter((p) => getSubCategoryL1Id(p) === sub1Id);
    if (sub2Id) base = base.filter((p) => getSubCategoryL2Id(p) === sub2Id);

    // ✅ search: ถ้าไม่มี keyword ก็จบตรงนี้
    if (!keyword) return base;

    return base.filter((p) => {
      const idStr = String(getId(p));
      const question = String(getQuestion(p) ?? "").toLowerCase();

      // ✅ ชื่อหมวดจาก map (id → title)
      const catFromMaps = getCatTextFromIds(p);

      // ✅ fallback: ถ้า backend แนบ object หมวดมาด้วย
      const catFromObj = [
        (p as any)?.main_category?.title,
        (p as any)?.main_category?.name,
        (p as any)?.sub_category_l1?.title,
        (p as any)?.sub_category_l1?.name,
        (p as any)?.sub_category_l2?.title,
        (p as any)?.sub_category_l2?.name,

        // เผื่อบาง endpoint ส่งรูปแบบอื่น
        (p as any)?.MainCategory?.Title,
        (p as any)?.MainCategory?.Name,
        (p as any)?.SubCategoryL1?.Title,
        (p as any)?.SubCategoryL1?.Name,
        (p as any)?.SubCategoryL2?.Title,
        (p as any)?.SubCategoryL2?.Name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // ✅ optional: ค้น status / reject reason ด้วย
      const statusText = String(getDisplayStatus(p) ?? "").toLowerCase();
      const rejectText = String(getRejectReason(p) ?? "").toLowerCase();

      return (
        idStr.includes(keyword) ||
        question.includes(keyword) ||
        catFromMaps.includes(keyword) ||
        catFromObj.includes(keyword) ||
        statusText.includes(keyword) ||
        rejectText.includes(keyword)
      );
    });
  }, [polls, q, activeTab, status, mainId, sub1Id, sub2Id, mainMap, sub1Map, sub2Map]);

  // --------- confirm modal ----------
  const openConfirm = (
    title: string,
    desc: string,
    danger: boolean,
    action: () => Promise<void>
  ) => {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    setConfirmDanger(danger);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const runConfirm = async () => {
    if (!confirmAction) return;
    try {
      await confirmAction();
      setConfirmOpen(false);
      setConfirmAction(null);
    } catch (e) {
      console.error(e);
      alert("Action failed");
    }
  };

  // ---------- actions ----------
  const handleDelete = (id: number) => {
    openConfirm("ลบโพลนี้ใช่หรือไม่?", "การกระทำนี้ไม่สามารถย้อนกลับได้", true, async () => {
      await pollAPI.deletePoll(id);
      await fetchPolls(undefined); // ✅ refresh ทั้งหมด
    });
  };

  const handleSubmit = (id: number) => {
    openConfirm(
      "ส่งตรวจสอบหรือไม่?",
      "คุณจะไม่สามารถแก้ไขโพลนี้ได้ในระหว่างที่รอการตรวจสอบ",
      false,
      async () => {
        await pollAPI.submitForReview(id);
        await fetchPolls(undefined); // ✅ refresh ทั้งหมด
      }
    );
  };

  const handleCancel = (id: number) => {
    openConfirm(
      "ถอนคำขอโพลกลับ?",
      "การถอนคำขอจะย้ายโพลกลับไปยังแบบร่าง เพื่อให้คุณสามารถแก้ไขได้",
      true,
      async () => {
        await pollAPI.cancelRequest(id);
        await fetchPolls(undefined); // ✅ refresh ทั้งหมด
      }
    );
  };

  const handleClose = (id: number) => {
    openConfirm(
      "ปิดโพลนี้ใช่หรือไม่?",
      "เมื่อปิดแล้ว โพลนี้จะไม่สามารถเปิดใหม่ได้ การโหวตจะหยุดทันที",
      true,
      async () => {
        await pollAPI.closePoll(id);
        await fetchPolls(undefined); // ✅ refresh ทั้งหมด
      }
    );
  };

  const openDetail = async (p: Poll) => {
    const id = getId(p);
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedPoll(null);
    setCatNames({}); // ✅ กันค้างค่าเก่า

    try {
      const res = await pollAPI.getMyPollByID(id);
      const payload = (res as any)?.data?.data ?? (res as any)?.data;
      setSelectedPoll(payload);
    } catch (e) {
      console.error(e);
      alert("Failed to load poll detail");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedPoll(null);
    setCatNames({});
  };

  const canEditSubmitDelete = (p: Poll) => {
    const s = getBaseStatus(p);
    return s === "DRAFT" || s === "REJECTED";
  };

  // ✅ ลบได้: DRAFT, REJECTED, และ CLOSED
  const canDelete = (p: Poll) => {
    const s = getBaseStatus(p);
    const ds = getDisplayStatus(p);
    return s === "DRAFT" || s === "REJECTED" || ds === "CLOSED";
  };

  // ✅ ปิดได้: เฉพาะ OPEN
  const canClose = (p: Poll) => {
    const ds = getDisplayStatus(p);
    return ds === "OPEN";
  };

  const canCancel = (p: Poll) => getBaseStatus(p) === "PENDING_REVIEW";

  // ✅ ดูผล: OPEN หรือ CLOSED เท่านั้น (UPCOMING ไม่ให้ดูผล)
  const canViewResult = (p: Poll) => {
    const ds = getDisplayStatus(p);
    return ds === "OPEN" || ds === "CLOSED";
  };


  return (
    <div className="my-polls-page">
      {/* Back Button */}
      <div style={{ marginBottom: 16 }}>
        <button className="my-back-btn" onClick={() => navigate("/User/Polls")}>
          ← กลับ
        </button>
      </div>

      {/* HERO */}
      <div className="my-hero">
        <div>
          <div className="my-title">โพลของฉัน</div>
          <div className="my-subtitle">จัดการโพลของคุณทั้งหมด</div>

        </div>

        <div className="my-toolbar">
          <div className="my-search">
            <span className="my-search-ico">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหา โดย คำถาม, หมวดหมู่..."
            />
          </div>

          <button className="btn btn-primary" onClick={() => navigate("/User/Polls/create")}>
            ➕ สร้างโพล          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat">
          <div className="k">Total</div>
          <div className="v">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="k">Draft</div>
          <div className="v">{stats.draft}</div>
        </div>
        <div className="stat">
          <div className="k">Pending</div>
          <div className="v">{stats.pending}</div>
        </div>
        <div className="stat">
          <div className="k">Published</div>
          <div className="v">{stats.published}</div>
        </div>
        <div className="stat">
          <div className="k">Rejected</div>
          <div className="v">{stats.rejected}</div>
        </div>
        <div className="stat">
          <div className="k">Closed</div>
          <div className="v">{stats.closed}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="my-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={activeTab === t.id ? "tab tab-active" : "tab"}
            onClick={() => setActiveTab(t.id)}
            type="button"
          >
            {t.label}
            <span className="tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="table-card">
        <div className="table-head">
          <div className="table-title">รายการโพล</div>
          {loading ? <div className="loading">กำลังโหลด...</div> : null}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>คำถาม</th>
                <th style={{ width: 170 }}>สถานะ</th>
                <th style={{ width: 190 }}>วันที่สร้าง</th>
                <th style={{ width: 420, textAlign: "right" }}>การกระทำ</th>
              </tr>
            </thead>

            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <div className="empty-box">📦</div>
                      <div className="empty-title">No polls</div>
                      <div className="empty-sub">Try changing tab or create a new poll.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const id = getId(p);
                  const status = getDisplayStatus(p);
                  const created = getCreatedAt(p);
                  const question = getQuestion(p);

                  const isDeleted = isDeletedByAdmin(p);
                  const rowStyle = isDeleted ? { opacity: 0.6, backgroundColor: "#fff5f5", cursor: "pointer" } : { cursor: "pointer" };

                  return (
                    <tr key={id} style={rowStyle} onClick={() => openDetail(p)}>
                      <td className="mono">{id}</td>

                      <td className="question">
                        <div style={isDeleted ? { textDecoration: "line-through", color: "#999" } : {}}>
                          {question}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                          <StatusBadge status={status} />
                          {/* ✅ Admin moderation badges */}
                          {isDeleted && (
                            <span className="badge badge-rejected" style={{ fontSize: "0.75rem", padding: "2px 6px" }}>
                              ❌ แอดมินลบ
                            </span>
                          )}
                          {!isDeleted && isClosedByAdmin(p) && (
                            <span className="badge badge-admin-closed" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                              🔒 แอดมินปิด
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="muted">
                        {created ? dayjs(created).format("DD/MM/YYYY HH:mm") : "-"}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className="actions" onClick={(e) => e.stopPropagation()}>

                          {/* ✅ ถ้าโดน Admin ลบ -> ห้าม Edit/Submit */}
                          {!isDeleted && canEditSubmitDelete(p) && (
                            <>
                              <button
                                className="btn btn-outline"
                                onClick={() => navigate(`/User/Polls/edit/${id}`)}
                                type="button"
                              >
                                ✏️ แก้ไข
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => handleSubmit(id)}
                                type="button"
                              >
                                📤 ส่งตรวจ
                              </button>
                            </>
                          )}

                          {!isDeleted && canClose(p) && (
                            <button
                              className="btn btn-warning"
                              onClick={() => handleClose(id)}
                              type="button"
                            >
                              🔒 ปิดโพล
                            </button>
                          )}

                          {!isDeleted && canDelete(p) && (
                            <button
                              className="btn btn-ghost-danger"
                              onClick={() => handleDelete(id)}
                              type="button"
                            >
                              🗑 ลบ
                            </button>
                          )}

                          {!isDeleted && canCancel(p) && (
                            <button
                              className="btn btn-danger"
                              onClick={() => handleCancel(id)}
                              type="button"
                            >
                              ⛔ ยกเลิกคำขอ
                            </button>
                          )}

                          {!isDeleted && canViewResult(p) && (
                            <button
                              className="btn btn-outline"
                              onClick={() => navigate(`/User/Polls/${id}`)}
                              type="button"
                            >
                              📊 ผลโหวต
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

      {/* DETAIL CARD MODAL */}
      {detailOpen && (
        <div className="card-backdrop" onMouseDown={closeDetail}>
          <div className="card-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="card-head">
              <div>
                <div className="card-title">Poll Detail</div>

                <div className="card-sub">
                  ID #{selectedPoll ? getId(selectedPoll) : "-"} • Created{" "}
                  {selectedPoll && getCreatedAt(selectedPoll)
                    ? dayjs(getCreatedAt(selectedPoll)).format("DD/MM/YYYY")
                    : "-"}
                </div>
              </div>

              <button className="icon-btn" onClick={closeDetail} type="button">
                ✕
              </button>
            </div>

            <div className="card-body">
              {detailLoading ? (
                <div className="muted">Loading detail...</div>
              ) : selectedPoll ? (
                <>
                  {/* ✅ 1. Admin Delete Reason (TOP & PROMINENT) */}
                  {isDeletedByAdmin(selectedPoll) && (
                    <div
                      style={{
                        backgroundColor: "#fee2e2",
                        border: "1px solid #ef4444",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          color: "#b91c1c",
                          fontWeight: "bold",
                          fontSize: "1rem",
                        }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>❌</span>
                        <span>This poll has been removed by Admin</span>
                      </div>

                      {getDeletedAt(selectedPoll) && (
                        <div style={{ fontSize: "0.85rem", color: "#7f1d1d", marginBottom: "12px", marginLeft: "28px" }}>
                          Deleted on: {dayjs(getDeletedAt(selectedPoll)).format("D MMM YYYY [at] HH:mm")}
                        </div>
                      )}

                      <div style={{ fontWeight: 600, color: "#7f1d1d", marginBottom: "4px", marginLeft: "4px" }}>
                        Reason:
                      </div>
                      <div
                        style={{
                          backgroundColor: "#fff",
                          padding: "12px",
                          borderRadius: "6px",
                          fontSize: "0.95rem",
                          color: "#333",
                          border: "1px solid #fca5a5",
                          lineHeight: "1.5",
                        }}
                      >
                        {getAdminDeleteReason(selectedPoll) || "No reason specified."}
                      </div>
                    </div>
                  )}

                  <div className="detail-block">
                    <div className="detail-label">Question</div>
                    <div
                      className="detail-value"
                      style={
                        isDeletedByAdmin(selectedPoll)
                          ? { color: "#555" } // เอาขีดฆ่าออก เหลือแค่สีเทาให้รู้ว่าเก่า
                          : {}
                      }
                    >
                      {getQuestion(selectedPoll)}
                    </div>
                  </div>


                  <div className="detail-grid">
                    <div className="detail-block">
                      <div className="detail-label">Status</div>
                      <div className="detail-value">
                        <StatusBadge status={getDisplayStatus(selectedPoll)} />
                      </div>
                    </div>

                    <div className="detail-block">
                      <div className="detail-label">Allow Multiple</div>
                      <div className="detail-value">
                        {getAllowMultiple(selectedPoll) ? "Yes" : "No"}
                      </div>
                    </div>

                    <div className="detail-block">
                      <div className="detail-label">Max Choice</div>
                      <div className="detail-value">{getMaxChoice(selectedPoll) ?? "-"}</div>
                    </div>

                    <div className="detail-block">
                      <div className="detail-label">Time Range</div>
                      <div className="detail-value muted">
                        {getStartAt(selectedPoll)
                          ? dayjs(getStartAt(selectedPoll)).format("DD/MM/YYYY HH:mm")
                          : "-"}{" "}
                        →{" "}
                        {getEndAt(selectedPoll)
                          ? dayjs(getEndAt(selectedPoll)).format("DD/MM/YYYY HH:mm")
                          : "-"}
                      </div>
                    </div>
                    <div className="detail-block">
                      <div className="detail-label">Identity</div>
                      <div className="detail-value">
                        {getIsAnonymous(selectedPoll) ? "ไม่เปิดเผยชื่อ" : "เปิดเผยชื่อ"}
                      </div>
                    </div>

                    {/* ✅ วางตรงนี้เลย */}
                    <div className="detail-block">
                      <div className="detail-label">Category</div>

                      <div className="detail-value cat-grid">
                        <div className="cat-row">
                          <span className="cat-label">หมวดหลัก:</span>
                          <span className="cat-value">
                            {catNames.main ??
                              ((selectedPoll as any)?.main_category_id
                                ? `#${(selectedPoll as any).main_category_id}`
                                : "-")}
                          </span>
                        </div>

                        <div className="cat-row">
                          <span className="cat-label">หมวดย่อย 1:</span>
                          <span className="cat-value">
                            {catNames.sub1 ??
                              ((selectedPoll as any)?.sub_category_l1_id
                                ? `#${(selectedPoll as any).sub_category_l1_id}`
                                : "-")}
                          </span>
                        </div>

                        <div className="cat-row">
                          <span className="cat-label">หมวดย่อย 2:</span>
                          <span className="cat-value">
                            {catNames.sub2 ??
                              ((selectedPoll as any)?.sub_category_l2_id
                                ? `#${(selectedPoll as any).sub_category_l2_id}`
                                : "-")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reject reason */}
                  {getBaseStatus(selectedPoll) === "REJECTED" && getRejectReason(selectedPoll) && (
                    <div className="detail-block" style={{ marginTop: 10 }}>
                      <div className="detail-label">Reject Reason</div>
                      <div className="detail-value">{getRejectReason(selectedPoll)}</div>
                    </div>
                  )}


                  {/* ✅ Admin Close Reason */}
                  {isClosedByAdmin(selectedPoll) && getAdminCloseReason(selectedPoll) && (
                    <div className="detail-block" style={{ marginTop: 10 }}>
                      <div className="detail-label">🔒 Closed by Admin</div>

                      {/* ✅ Timestamp */}
                      {getUpdatedAt(selectedPoll) && (
                        <div style={{
                          fontSize: "0.85rem",
                          color: "#856404",
                          marginBottom: "8px",
                          fontWeight: 600
                        }}>
                          Closed on: {dayjs(getUpdatedAt(selectedPoll)).format("D MMM YYYY [at] HH:mm")}
                        </div>
                      )}

                      {/* ✅ Reason */}
                      <div
                        className="detail-value"
                        style={{
                          padding: "12px",
                          backgroundColor: "#fff3cd",
                          border: "1px solid #ffc107",
                          borderRadius: "6px",
                          color: "#856404",
                        }}
                      >
                        {getAdminCloseReason(selectedPoll)}
                      </div>
                    </div>
                  )}



                  {/* ✅ OPTIONS + click to zoom */}
                  <div className="detail-block" style={{ marginTop: 10 }}>
                    <div className="detail-label">Options</div>

                    <div className="opt-grid">
                      {getOptions(selectedPoll).map((opt, idx) => {
                        const raw = optionImgUrl(opt);
                        const img = raw ? toFullUrl(raw) : "";

                        return (
                          <div className="opt-item" key={idx}>
                            {img ? (
                              <button
                                type="button"
                                className="opt-imgBtn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openImg(img);
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                title="ดูรูป"
                              >
                                <img
                                  className="opt-img"
                                  src={img}
                                  alt={optionLabel(opt)}
                                  draggable={false}
                                />
                              </button>
                            ) : null}

                            <div className="opt-meta">
                              <div className="opt-title">Option {idx + 1}</div>
                              <div className="opt-text">{optionLabel(opt)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card-actions">
                    <button className="btn btn-outline" onClick={closeDetail} type="button">
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <div className="muted">No data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ IMAGE LIGHTBOX OVERLAY */}
      {imgOpen && (
        <div className="img-overlay" onMouseDown={closeImg}>
          <div className="img-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="img-close" onClick={closeImg}>
              ✕
            </button>
            <img className="img-full" src={imgSrc} alt="poll option" />
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {
        confirmOpen && (
          <div className="modal-backdrop" onMouseDown={() => setConfirmOpen(false)}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modal-title">{confirmTitle}</div>
              <div className="modal-sub">{confirmDesc}</div>

              <div className="modal-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setConfirmOpen(false)}
                  type="button"
                >
                  ยกเลิก
                </button>
                <button
                  className={confirmDanger ? "btn btn-danger" : "btn btn-primary"}
                  onClick={runConfirm}
                  type="button"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default MyPolls;
