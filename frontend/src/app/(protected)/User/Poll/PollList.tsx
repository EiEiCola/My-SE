import React, { useEffect, useState } from "react";
import { Card, Tag, Button, Spin, Row, Col, Typography, Empty } from "antd";
import { CheckSquareOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { type Poll, pollAPI } from "../../../../services/http/poll";
import dayjs from "dayjs";
import "./PollList.css";

const { Title, Paragraph } = Typography;

const PollList: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [polls, setPolls] = useState<Poll[]>([]);

    useEffect(() => {
        loadPolls();
    }, []);

    const loadPolls = async () => {
        setLoading(true);
        try {
            const res = await pollAPI.listPublished();
            setPolls(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="poll-list-container">
            <div className="poll-list-header">
                <div>
                    <Title level={2}>Community Polls</Title>
                    <Paragraph>Voice your opinion on current topics.</Paragraph>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/User/Polls/create")}>
                    Create Poll
                </Button>
            </div>

            {loading ? (
                <div className="loading-container"><Spin size="large" /></div>
            ) : polls.length === 0 ? (
                <Empty description="No active polls right now" />
            ) : (
                <Row gutter={[24, 24]}>
                    {polls.map((poll) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={poll.id}>
                            <Card
                                hoverable
                                className="poll-card-custom"
                                actions={[
                                    <Button type="text" block icon={<CheckSquareOutlined />} onClick={() => navigate(`/User/Polls/${poll.id}`)}>
                                        Vote Now
                                    </Button>
                                ]}
                                title={<span className="poll-card-title">{poll.question}</span>}
                            >
                                <div className="poll-card-desc-container">
                                    <Paragraph className="poll-card-desc">
                                        {poll.description || "No description provided."}
                                    </Paragraph>
                                </div>
                                <div className="poll-card-footer">
                                    <Tag color="green">Active</Tag>
                                    <span className="poll-date">
                                        {dayjs(poll.created_at).format("DD MMM YYYY")}
                                    </span>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default PollList;
