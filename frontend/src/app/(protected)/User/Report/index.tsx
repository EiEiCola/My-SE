import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  Upload,
  message,
  List,
  Tag,
  Modal,
  Space,
  Empty,
  Image,
  Pagination,
} from "antd";
import type { UploadFile } from "antd";
import {
  ExclamationCircleOutlined,
  UploadOutlined,
  HistoryOutlined,
  FormOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { ReportService } from "../../../../services/http/report";
import type { CreateReportInput, Report as ReportType } from "../../../../services/http/report";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { confirm } = Modal;

const ReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [form] = Form.useForm();

  // State
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState<ReportType[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [pageSize] = useState(10);

  // Edit State
  const [editId, setEditId] = useState<number | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Fetch History with pagination
  const fetchReports = async (page: number = 1) => {
    setLoadingHistory(true);
    try {
      const res = await ReportService.getMyReports({ page, page_size: pageSize });
      if (res.data && Array.isArray(res.data.data)) {
        setReports(res.data.data);
        setHistoryTotal(res.data.total || 0);
        setHistoryPage(page);
      }
    } catch (err) {
      console.error(err);
      message.error("โหลดประวัติการแจ้งปัญหาไม่ได้");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchReports(1);
    }
  }, [activeTab]);

  // Handle Submit
  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      // Handle Image
      let imageBase64 = "";
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const file = fileList[0].originFileObj;
        if (file.size > 5 * 1024 * 1024) {
          message.error("รูปภาพขนาดใหญ่เกิน 5MB");
          setSubmitting(false);
          return;
        }
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else if (fileList.length > 0 && fileList[0].url) {
        // Existing image (if valid logic existed to keep old images)
        // For simplicity in this demo, we might re-upload or handle backend persistence
        imageBase64 = fileList[0].url;
      }

      const payload: CreateReportInput = {
        title: values.title,
        description: values.description,
        target_type: values.target_type,
        medias: imageBase64 ? [{ url: imageBase64, type: 'image', is_attachment: false }] : []
      };

      if (editId) {
        await ReportService.updateReport(editId, payload);
        message.success("แก้ไขรายงานเรียบร้อย");
        resetForm();
        setActiveTab("history"); // Go to history to see change
      } else {
        await ReportService.createReport(payload);
        message.success("ส่งรายงานเรียบร้อย ขอบคุณครับ!");
        resetForm();
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.error || "เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setFileList([]);
    setEditId(null);
  };

  const handleEdit = (item: ReportType) => {
    setEditId(item.id);
    setActiveTab("create");
    form.setFieldsValue({
      title: item.title,
      description: item.description,
      target_type: item.target_type,
    });
    // If has media
    if (item.media && item.media.length > 0) {
      setFileList([{
        uid: '-1',
        name: 'image.png',
        status: 'done',
        url: item.media[0].url,
        thumbUrl: item.media[0].url,
      }]);
    } else {
      setFileList([]);
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: "ยืนยันการลบ?",
      icon: <ExclamationCircleOutlined />,
      content: "คุณต้องการลบรายงานปัญหานี้ใช่หรือไม่",
      onOk: async () => {
        try {
          await ReportService.deleteReport(id);
          message.success("ลบรายงานสำเร็จ");
          fetchReports();
        } catch (e) {
          message.error("ลบไม่ได้");
        }
      }
    });
  };

  const getStatusTag = (statusId: number) => {
    switch (statusId) {
      case 1: return <Tag color="orange">รอตรวจสอบ</Tag>;
      case 2: return <Tag color="blue">กำลังดำเนินการ</Tag>;
      case 3: return <Tag color="green">เสร็จสิ้น</Tag>;
      case 4: return <Tag color="red">ปฏิเสธ</Tag>;
      default: return <Tag>ไม่ทราบสถานะ</Tag>;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-transparent p-6">
      <div className="max-w-4xl mx-auto">
        <Card
          bordered={false}
          className="shadow-sm rounded-2xl"
          bodyStyle={{ padding: 0 }}
        >
          <div className="p-8 border-b border-gray-100">
            <Title level={3} style={{ margin: 0, color: "#c42e0a" }}>
              แจ้งปัญหาและร้องเรียน
            </Title>
            <Text type="secondary">
              พบปัญหาการใช้งาน หรือต้องการแจ้งเบาะแส แจ้งเราได้ที่นี่
            </Text>
          </div>

          <div className="p-8 pt-0">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="large"
              items={[
                {
                  label: (<span><FormOutlined /> แจ้งปัญหาใหม่</span>),
                  key: "create",
                  children: (
                    <div className="max-w-2xl mt-4">
                      <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{ target_type: "system" }}
                      >
                        <Form.Item
                          label="หัวข้อปัญหา"
                          name="title"
                          rules={[{ required: true, message: "กรุณาระบุหัวข้อ" }]}
                        >
                          <Input placeholder="เช่น เว็บเข้าไม่ได้, พบเนื้อหาไม่เหมาะสม" size="large" />
                        </Form.Item>

                        <Form.Item
                          label="ประเภท"
                          name="target_type"
                          rules={[{ required: true }]}
                        >
                          <Select size="large">
                            <Option value="system">ปัญหาการใช้งานระบบ (Bug)</Option>
                            <Option value="content">เนื้อหาไม่เหมาะสม</Option>
                            <Option value="user">รายงานผู้ใช้งาน</Option>
                            <Option value="other">อื่นๆ</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item
                          label="รายละเอียด"
                          name="description"
                          rules={[{ required: true, message: "กรุณาระบุรายละเอียด" }]}
                        >
                          <TextArea rows={6} placeholder="อธิบายปัญหาที่พบให้ชัดเจน..." />
                        </Form.Item>

                        <Form.Item label="รูปภาพประกอบ (ถ้ามี)">
                          <Upload
                            listType="picture-card"
                            maxCount={1}
                            fileList={fileList}
                            beforeUpload={() => false}
                            onChange={({ fileList }) => setFileList(fileList)}
                          >
                            {fileList.length < 1 && (
                              <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>อัปโหลด</div>
                              </div>
                            )}
                          </Upload>
                        </Form.Item>

                        <div className="flex gap-4 mt-8">
                          <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={submitting}
                            style={{ background: "#c42e0a", borderColor: "#c42e0a", minWidth: 120 }}
                          >
                            {editId ? "บันทึกการแก้ไข" : "ส่งรายงาน"}
                          </Button>
                          {editId && (
                            <Button size="large" onClick={() => { resetForm(); setActiveTab("history"); }}>
                              ยกเลิก
                            </Button>
                          )}
                        </div>
                      </Form>
                    </div>
                  )
                },
                {
                  label: (<span><HistoryOutlined /> ประวัติการแจ้ง</span>),
                  key: "history",
                  children: (
                    <div className="mt-4">
                      <List
                        loading={loadingHistory}
                        itemLayout="vertical"
                        dataSource={reports}
                        locale={{ emptyText: <Empty description="ไม่มีประวัติการแจ้งปัญหา" /> }}
                        renderItem={(item) => (
                          <List.Item
                            style={{ background: "#fafafa", borderRadius: 8, padding: 20, marginBottom: 16 }}
                            actions={[]}
                          >
                            <List.Item.Meta
                              title={
                                <div className="flex justify-between items-start">
                                  <span className="text-lg font-semibold">{item.title}</span>
                                  {getStatusTag(item.status_id)}
                                </div>
                              }
                              description={
                                <Space direction="vertical" size={2}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    เมื่อ: {new Date(item.created_at).toLocaleString("th-TH")}
                                  </Text>
                                  <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'อ่านต่อ' }} style={{ marginTop: 8 }}>
                                    {item.description}
                                  </Paragraph>
                                </Space>
                              }
                            />
                            {item.media && item.media.length > 0 && (
                              <div className="mt-4">
                                <Image
                                  width={100}
                                  src={item.media[0].url}
                                  style={{ borderRadius: 8 }}
                                />
                              </div>
                            )}
                          </List.Item>
                        )}
                      />
                      {historyTotal > pageSize && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                          <Pagination
                            current={historyPage}
                            pageSize={pageSize}
                            total={historyTotal}
                            onChange={(page) => fetchReports(page)}
                            showTotal={(total) => `ทั้งหมด ${total} รายการ`}
                          />
                        </div>
                      )}
                    </div>
                  )
                }
              ]}
            />
          </div>
        </Card>
      </div>
    </main>
  );
};

export default ReportPage;