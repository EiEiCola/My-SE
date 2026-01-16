import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  NotificationOutlined,
  TeamOutlined,
  GiftOutlined,
  BarChartOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import { Card, Row, Col, Statistic, Button, Spin, Typography, Table, Tag, Avatar } from "antd";
import { motion } from "framer-motion";

// Services
import { memberAPI } from "../../../../services/http/member_profile";
import { friendAPI } from "../../../../services/http/friend";
import postService from "../../../../services/http/post_service";
// Note: Imports based on file search results
import api from "../../../../services/http/api";

const { Title, Text } = Typography;

// Animation Variants (Defined outside)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3
    }
  }
};

// Sub-components (Defined outside)
const StatCard = ({ title, value, icon, gradient, loading }: any) => (
  <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
    <Card
      variant="borderless"
      className="shadow-sm hover:shadow-lg transition-all h-full overflow-hidden relative cursor-default"
      style={{
        borderRadius: 20,
        background: `linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)`,
        border: '1px solid #f0f0f0'
      }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full pointer-events-none"
        style={{ background: gradient }}
      />
      <div className="flex flex-col justify-between h-full relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100"
            style={{ background: gradient }}
          >
            {icon}
          </div>
        </div>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            {loading ? <Spin size="small" /> : value.toLocaleString()}
          </Title>
          <Text type="secondary" className="text-sm font-medium">
            {title}
          </Text>
        </div>
      </div>
    </Card>
  </motion.div>
);

const QuickAction = ({ title, icon, color, path, desc }: any) => {
  const navigate = useNavigate();
  return (
    <motion.div variants={itemVariants}>
      <div
        onClick={() => navigate(path)}
        className="bg-white p-5 rounded-2xl border border-gray-100 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group h-full flex flex-col items-center text-center"
      >
        <div className="mb-3 transform group-hover:scale-110 transition-transform duration-300">
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm"
            style={{ background: `${color}10`, color: color }}
          >
            {icon}
          </span>
        </div>
        <h3 className="font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-2">
          {desc}
        </p>
      </div>
    </motion.div>
  );
};

function HomeAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    userCount: 0,
    postCount: 0,
    reportCount: 0,
    announcementCount: 0
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [usersRes, posts, reports, announcements] = await Promise.all([
        friendAPI.getAllMembers().catch(() => []),
        postService.getAll().catch(() => ({ data: { data: [] } })),
        api.get("/admin/reports?status_id=1&page=1&page_size=5").catch(() => ({ data: { data: [] } })),
        api.get("/admin/announcements").catch(() => ({ data: { data: [] } }))
      ]);

      const allReportsRes = await api.get("/admin/reports").catch(() => ({ data: { data: [], total: 0 } }));

      let userList = [];
      if (Array.isArray(usersRes)) {
        userList = usersRes;
      } else if (usersRes && Array.isArray((usersRes as any).data)) {
        userList = (usersRes as any).data;
      }

      setStats({
        userCount: userList.length || 0,
        postCount: (posts.data?.data || []).length || 0,
        reportCount: allReportsRes.data?.total || 0,
        announcementCount: (announcements.data?.data || []).length || 0
      });

      setRecentReports(reports.data?.data || []);

    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingColumns = [
    {
      title: 'Post/Target',
      dataIndex: 'target_id',
      key: 'target',
      render: (id: number, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar
            shape="square"
            src={record.media?.[0]?.url && record.media[0].url !== "" ? record.media[0].url : undefined}
            icon={<FileTextOutlined />}
            className="bg-orange-50 text-orange-500"
          />
          <div className="flex flex-col">
            <Text strong className="text-xs">{record.target_type} #{id}</Text>
            <Text type="secondary" className="text-[10px]">{new Date(record.created_at).toLocaleDateString()}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Reported By',
      dataIndex: 'reporter',
      key: 'reporter',
      render: (reporter: any) => (
        <span className="text-xs text-gray-500">{reporter?.username || 'user'}</span>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          size="small"
          type="link"
          className="p-0 text-orange-500 font-medium text-xs"
          onClick={() => navigate('/Admin/ReportManage')}
        >
          Review <ArrowRightOutlined />
        </Button>
      )
    }
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800 }} className="tracking-tight text-gray-800">
              Admin Dashboard
            </Title>
            <Text type="secondary" className="flex items-center gap-2">
              <ClockCircleOutlined />
              {new Date().toLocaleDateString('th-TH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </div>
          <div className="flex gap-3">
            <Button type="primary" size="large" icon={<NotificationOutlined />} onClick={() => navigate('/Admin/AnnouncementManage/create')} className="bg-orange-500 hover:bg-orange-600 border-none shadow-orange-200 shadow-lg" style={{ background: '#f97316' }}>
              ลงประกาศใหม่
            </Button>
          </div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="จำนวนสมาชิก"
              value={stats.userCount}
              icon={<TeamOutlined style={{ fontSize: 24 }} />}
              gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
              loading={loading}
            />
            <StatCard
              title="โพสต์ทั้งหมด"
              value={stats.postCount}
              icon={<FileTextOutlined style={{ fontSize: 24 }} />}
              gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              loading={loading}
            />
            <StatCard
              title="รายงานรอตรวจสอบ"
              value={stats.reportCount}
              icon={<WarningOutlined style={{ fontSize: 24 }} />}
              gradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              loading={loading}
            />
            <StatCard
              title="ข่าวประกาศ"
              value={stats.announcementCount}
              icon={<NotificationOutlined style={{ fontSize: 24 }} />}
              gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              loading={loading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Quick Actions (2 cols wide) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-orange-500 rounded-full" />
                <Title level={4} style={{ margin: 0 }}>Quick Access</Title>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickAction
                  title="สมาชิก"
                  desc="จัดการผู้ใช้งาน"
                  icon={<TeamOutlined />}
                  color="#2563eb"
                  path="/Admin/ProfileManage"
                />
                <QuickAction
                  title="Reports"
                  desc="ตรวจสอบรายงาน"
                  icon={<WarningOutlined />}
                  color="#dc2626"
                  path="/Admin/ReportManage"
                />
                <QuickAction
                  title="รางวัล"
                  desc="Point System"
                  icon={<GiftOutlined />}
                  color="#7c3aed"
                  path="/Admin/RewardManage"
                />
                <QuickAction
                  title="ประกาศ"
                  desc="ข่าวประชาสัมพันธ์"
                  icon={<NotificationOutlined />}
                  color="#d97706"
                  path="/Admin/AnnouncementManage"
                />
                <QuickAction
                  title="Polls"
                  desc="แบบสำรวจ"
                  icon={<BarChartOutlined />}
                  color="#0891b2"
                  path="/Admin/PollManage"
                />
                <QuickAction
                  title="Reviews"
                  desc="รีวิวการใช้งาน"
                  icon={<SettingOutlined />}
                  color="#059669"
                  path="/Admin/ReviewManage"
                />
                <QuickAction
                  title="Groups"
                  desc="หมวดหมู่"
                  icon={<DatabaseOutlined />}
                  color="#db2777"
                  path="/Admin/GroupManage"
                />
                <QuickAction
                  title="Posts"
                  desc="จัดการโพสต์"
                  icon={<FileTextOutlined />}
                  color="#10b981"
                  path="/Admin/PostManage"
                />
              </div>
            </div>

            {/* Right: Recent Pending Reports (1 col wide) */}
            <div className="lg:col-span-1">
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <WarningOutlined className="text-red-500" />
                    <span className="font-bold">Pending Reports</span>
                  </div>
                }
                extra={<Link to="/Admin/ReportManage" className="text-xs text-orange-500">View All</Link>}
                variant="borderless"
                className="shadow-sm h-full"
                style={{ borderRadius: 16 }}
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  columns={pendingColumns}
                  dataSource={recentReports}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  className="bg-transparent"
                />
                {recentReports.length === 0 && !loading && (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No pending reports 🎉
                  </div>
                )}
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default HomeAdmin
