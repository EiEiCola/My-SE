import React, { useState, useEffect } from "react";
import { message, Avatar, Empty, Spin, Popconfirm, Input, Tag, Select, Button, Card, Pagination } from "antd";
import {
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  StopOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined
} from "@ant-design/icons";

const { Option } = Select;

// --- Interfaces ---
interface Member {
  ID: number;
  username: string;
  first_name?: string;
  last_name?: string;
  member_picture?: string;
}

interface FriendRequest {
  rf_id: number;
  sent_member_id: number;
  receive_member_id: number;
  reques_status_id: number;
  sent_member?: Member;
  receive_member?: Member;
  created_at: string;
}

interface Relation {
  rela_id: number;
  member1_ID: number;
  member2_ID: number;
  active: boolean;
  member1?: Member;
  member2?: Member;
  created_at: string;
}

interface Block {
  b_id: number;
  blocker_id: number;
  blocked_id: number;
  active: boolean;
  blocker?: Member;
  blocked?: Member;
  created_at: string;
}

const FriendManage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"requests" | "relations" | "blocks">("requests");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ requests: FriendRequest[], relations: Relation[], blocks: Block[] }>({
    requests: [],
    relations: [],
    blocks: []
  });

  // Search & Filter
  const [searchSource, setSearchSource] = useState("");
  const [searchTarget, setSearchTarget] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20); // Fixed at 20 items per page

  // --- Helper: Format Date ---
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  // --- Search Logic ---
  const isMatch = (m: Member | undefined, keyword: string) => {
    if (!keyword || keyword.trim() === "") return true;
    if (!m) return false;
    const lowerKey = keyword.trim().toLowerCase();
    const fullName = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
    const username = (m.username || "").toLowerCase();
    return fullName.includes(lowerKey) || username.includes(lowerKey);
  };

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = { "Authorization": `Bearer ${token}` };
      let endpoint = "";

      if (activeTab === "requests") endpoint = "friend-requests";
      else if (activeTab === "relations") endpoint = "friend-logs";
      else if (activeTab === "blocks") endpoint = "blocks";

      const res = await fetch(`/api/admin/${endpoint}`, { headers });
      if (!res.ok) throw new Error("Fetch failed");

      const result = await res.json();

      if (Array.isArray(result)) {
        const sorted = result.sort((a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        setData(prev => ({ ...prev, [activeTab]: sorted }));
      } else {
        setData(prev => ({ ...prev, [activeTab]: [] }));
      }

    } catch (err) {
      message.error("ไม่สามารถดึงข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchSource("");
    setSearchTarget("");
    setFilterStatus("all");
    setCurrentPage(1); // ✅ Reset pagination
    fetchData();
  }, [activeTab]);

  // --- Delete Actions ---
  const confirmDelete = async (type: 'req' | 'rel' | 'block', id1: number, id2?: number) => {
    const token = localStorage.getItem("token");
    if (!token) { message.error("กรุณาเข้าสู่ระบบใหม่"); return; }

    try {
      let url = "";
      if (type === 'req') url = `/api/admin/friend-requests/${id1}`;
      if (type === 'rel') url = `/api/admin/friendships?m1=${id1}&m2=${id2}`;
      if (type === 'block') url = `/api/admin/blocks?blocker_id=${id1}&blocked_id=${id2}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        message.success("ลบข้อมูลสำเร็จ");
        fetchData();
      } else {
        message.error("ลบไม่สำเร็จ");
      }
    } catch (e) { message.error("เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
  };

  // --- Filter Logic ---
  const getFilteredData = () => {
    const filterFn = (item: any, source: Member, target: Member, status: any, statusKey: string) => {
      const matchSource = isMatch(source, searchSource);
      const matchTarget = isMatch(target, searchTarget);
      let matchStatus = true;
      if (filterStatus !== "all") {
        if (statusKey === 'reques_status_id') matchStatus = status.toString() === filterStatus;
        else matchStatus = status === (filterStatus === "true");
      }
      return matchSource && matchTarget && matchStatus;
    };

    if (activeTab === "requests") {
      return data.requests.filter(item => filterFn(item, item.sent_member!, item.receive_member!, item.reques_status_id, 'reques_status_id'));
    }
    if (activeTab === "relations") {
      return data.relations.filter(item => filterFn(item, item.member1!, item.member2!, item.active, 'active'));
    }
    if (activeTab === "blocks") {
      return data.blocks.filter(item => filterFn(item, item.blocker!, item.blocked!, item.active, 'active'));
    }
    return [];
  };

  const filteredData = getFilteredData();

  // ✅ Pagination Logic
  const totalItems = filteredData.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayData = filteredData.slice(startIndex, endIndex);

  // --- Labels ---
  const getLabels = () => {
    if (activeTab === 'requests') return { source: "ชื่อผู้ส่ง", target: "ชื่อผู้รับ" };
    if (activeTab === 'blocks') return { source: "คนบล็อก", target: "คนโดนบล็อก" };
    return { source: "Member 1", target: "Member 2" };
  }
  const labels = getLabels();

  // --- UI Components ---
  const StatusBadge = ({ status, type }: { status: any, type: 'req' | 'active' | 'block' }) => {
    let color = "default";
    let text = "Unknown";
    if (type === 'req') {
      if (status === 1) { color = "orange"; text = "Pending"; }
      else if (status === 2) { color = "green"; text = "Accepted"; }
      else if (status === 3) { color = "red"; text = "Rejected"; }
      else if (status === 4) { color = "default"; text = "Cancelled"; }
    } else if (type === 'active') {
      color = status ? "green" : "default"; text = status ? "Active" : "Inactive";
    } else if (type === 'block') {
      color = status ? "red" : "default"; text = status ? "Blocking" : "Unblocked";
    }
    return <Tag color={color} className="border-0 bg-opacity-20 font-medium px-3 rounded-full">{text}</Tag>;
  };

  const MemberInfo = ({ m, id }: { m?: Member, id: number }) => {
    if (!m) return <span className="text-gray-400 font-mono text-xs">ID: {id}</span>;
    return (
      <div className="flex items-center gap-3">
        <Avatar src={m.member_picture} icon={<UserOutlined />} size={36} className="bg-gray-100 flex-shrink-0 border border-gray-200" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-700 leading-tight">{m.username}</span>
          <span className="text-xs text-gray-500">{m.first_name} {m.last_name}</span>
        </div>
      </div>
    );
  };

  const TabButton = ({ id, label, icon }: { id: typeof activeTab, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2
        ${activeTab === id
          ? "border-blue-600 text-blue-600 bg-blue-50/20"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}
      `}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex-1 bg-gray-50/50 min-h-screen p-6 md:p-10 font-sans">

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Friends Management</h1>
        </div>
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={fetchData}
          className="text-gray-500 hover:bg-gray-100 rounded-full px-4"
        >
          Refresh
        </Button>
      </div>

      {/* Main Card */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white">
          <TabButton id="requests" label="Friend Requests" icon={<UserOutlined />} />
          <TabButton id="relations" label="Friendships" icon={<TeamOutlined />} />
          <TabButton id="blocks" label="Blocked Users" icon={<StopOutlined />} />
        </div>

        {/* ⭐⭐⭐ Filter Bar (Single Row Fixed) ⭐⭐⭐ */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3 w-full">

            {/* Search 1 */}
            <div className="flex-1 relative group">
              <span className="absolute left-3 top-2.5 text-gray-400 group-hover:text-blue-500 transition-colors z-10"><SearchOutlined /></span>
              <Input
                placeholder={`ค้นหา ${labels.source}...`}
                value={searchSource}
                onChange={(e) => setSearchSource(e.target.value)}
                allowClear
                className="w-full pl-10 rounded-lg bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-blue-100 hover:bg-gray-100 transition-all"
              />
            </div>

            {/* Search 2 */}
            <div className="flex-1 relative group">
              <span className="absolute left-3 top-2.5 text-gray-400 group-hover:text-blue-500 transition-colors z-10"><SearchOutlined /></span>
              <Input
                placeholder={`ค้นหา ${labels.target}...`}
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
                allowClear
                className="w-full pl-10 rounded-lg bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-blue-100 hover:bg-gray-100 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="w-48 flex-shrink-0">
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                className="w-full"
                suffixIcon={<FilterOutlined className="text-gray-400" />}
                style={{ height: '40px' }} // Match Input Height explicitly if needed
                variant="borderless"
                dropdownStyle={{ borderRadius: '8px', padding: '8px' }}
              >
                <Option value="all">สถานะทั้งหมด</Option>
                {activeTab === 'requests' && (
                  <>
                    <Option value="1"><Tag color="orange">Pending</Tag></Option>
                    <Option value="2"><Tag color="green">Accepted</Tag></Option>
                    <Option value="3"><Tag color="red">Rejected</Tag></Option>
                    <Option value="4"><Tag color="default">Cancelled</Tag></Option>
                  </>
                )}
                {(activeTab === 'relations' || activeTab === 'blocks') && (
                  <>
                    <Option value="true"><Tag color={activeTab === 'blocks' ? 'red' : 'green'}>{activeTab === 'blocks' ? 'Blocking' : 'Active'}</Tag></Option>
                    <Option value="false"><Tag color="default">{activeTab === 'blocks' ? 'Unblocked' : 'Inactive'}</Tag></Option>
                  </>
                )}
              </Select>
              {/* Add bottom border to simulate input style for the borderless select if desired, or keep as is for minimal look */}
              <div className="h-px bg-gray-200 mt-0 mx-1"></div>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-80"><Spin tip="Loading..." size="large" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/60 text-xs uppercase text-gray-400 font-semibold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 w-20">ID</th>
                    <th className="px-6 py-4 w-1/4">{activeTab === 'blocks' ? 'Blocker' : 'Initiator'}</th>
                    <th className="px-6 py-4 w-1/4">{activeTab === 'blocks' ? 'Blocked' : 'Target'}</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">

                  {/* REQUESTS */}
                  {activeTab === 'requests' && (displayData as FriendRequest[]).map((req) => (
                    <tr key={req.rf_id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">{req.rf_id}</td>
                      <td className="px-6 py-4"><MemberInfo m={req.sent_member} id={req.sent_member_id} /></td>
                      <td className="px-6 py-4"><MemberInfo m={req.receive_member} id={req.receive_member_id} /></td>
                      <td className="px-6 py-4"><StatusBadge status={req.reques_status_id} type="req" /></td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">{formatDate(req.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Popconfirm
                          title="ลบข้อมูล?"
                          description="ยืนยันการลบข้อมูลถาวร"
                          onConfirm={() => confirmDelete('req', req.rf_id)}
                          okText="ลบ"
                          cancelText="ยกเลิก"
                          okType="danger"
                          icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                        >
                          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all ml-auto">
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </td>
                    </tr>
                  ))}

                  {/* RELATIONS */}
                  {activeTab === 'relations' && (displayData as Relation[]).map((rel) => (
                    <tr key={rel.rela_id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">{rel.rela_id}</td>
                      <td className="px-6 py-4"><MemberInfo m={rel.member1} id={rel.member1_ID} /></td>
                      <td className="px-6 py-4"><MemberInfo m={rel.member2} id={rel.member2_ID} /></td>
                      <td className="px-6 py-4"><StatusBadge status={rel.active} type="active" /></td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">{formatDate(rel.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Popconfirm
                          title="ลบเพื่อน?"
                          description="ข้อมูลความสัมพันธ์จะหายไป"
                          onConfirm={() => confirmDelete('rel', rel.member1_ID, rel.member2_ID)}
                          okText="ลบ"
                          cancelText="ยกเลิก"
                          okType="danger"
                        >
                          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all ml-auto">
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </td>
                    </tr>
                  ))}

                  {/* BLOCKS */}
                  {activeTab === 'blocks' && (displayData as Block[]).map((block) => (
                    <tr key={block.b_id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">{block.b_id}</td>
                      <td className="px-6 py-4"><MemberInfo m={block.blocker} id={block.blocker_id} /></td>
                      <td className="px-6 py-4"><MemberInfo m={block.blocked} id={block.blocked_id} /></td>
                      <td className="px-6 py-4"><StatusBadge status={block.active} type="block" /></td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">{formatDate(block.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Popconfirm
                          title="ลบการบล็อก?"
                          description="ประวัติการบล็อกจะหายไป"
                          onConfirm={() => confirmDelete('block', block.blocker_id, block.blocked_id)}
                          okText="ลบ"
                          cancelText="ยกเลิก"
                          okType="danger"
                        >
                          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all ml-auto">
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {displayData.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
                  <span className="text-gray-400 text-sm mt-2">ไม่พบข้อมูลที่ค้นหา</span>
                </div>
              )}
            </div>
          )}

          {/* ✅ Pagination */}
          {!loading && totalItems > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <div className="text-sm text-white-500">
                แสดง {startIndex + 1} - {Math.min(endIndex, totalItems)} จากทั้งหมด {totalItems} รายการ
              </div>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalItems}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showQuickJumper={totalItems > 100}
                className="[&_.ant-pagination-item-active]:bg-blue-200 [&_.ant-pagination-item-active]:border-blue-600"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendManage;