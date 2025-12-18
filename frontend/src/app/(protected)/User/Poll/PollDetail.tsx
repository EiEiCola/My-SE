import React, { useEffect, useState } from "react";
import { Card, Button, Radio, Checkbox, Progress, message, Typography, Divider } from "antd";
import { CheckCircleOutlined, PicLeftOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { type Poll, type PollOption, pollAPI } from "../../../../services/http/poll";
import dayjs from "dayjs";
import "./PollDetail.css";

const { Title, Text } = Typography;

const PollDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(false);
    const [poll, setPoll] = useState<Poll | null>(null);
    const [options, setOptions] = useState<PollOption[]>([]);

    // Vote State
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        if (id) loadPollData(Number(id));
    }, [id]);

    const loadPollData = async (pollID: number) => {
        setLoading(true);
        try {
            // Get Results contains Poll Details + Option Counts
            const res = await pollAPI.getResults(pollID);
            setPoll(res.data.poll);
            setOptions(res.data.results || []);
        } catch (error) {
            console.error(error);
            message.error("Failed to load poll");
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async () => {
        if (selectedOptions.length === 0) {
            message.warning("Please select an option");
            return;
        }

        setLoading(true);
        try {
            await pollAPI.vote(Number(id), { option_ids: selectedOptions });
            message.success("Voted successfully!");
            setHasVoted(true);
            setShowResult(true);
            loadPollData(Number(id)); // Reload to update counts
        } catch (error: any) {
            // Check for duplicate vote
            if (error.response?.data?.error?.includes("already voted")) {
                message.info("You have already voted on this poll.");
                setHasVoted(true);
                setShowResult(true);
            } else {
                message.error("Failed to vote: " + (error.response?.data?.error || "Unknown error"));
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate total votes for percentage
    const totalVotes = options.reduce((sum, opt: any) => sum + (opt.count || opt.vote_count || 0), 0);

    if (!poll) return <div className="poll-detail-container text-center">Loading...</div>;

    const isEnded = poll.end_at && dayjs().isAfter(dayjs(poll.end_at));

    return (
        <div className="poll-detail-container">
            <Button
                icon={<ArrowLeftOutlined />}
                type="text"
                onClick={() => navigate("/User/Polls")}
                className="back-btn"
            >
                Back to Polls
            </Button>

            <Card>
                <div className="poll-detail-header">
                    <Title level={3} className="poll-detail-title">{poll.question}</Title>
                    {poll.description && <Text type="secondary">{poll.description}</Text>}
                    <div className="poll-tag-container">
                        {poll.allow_multiple ? (
                            <span className="tag-multiple-choice">Multiple Choice</span>
                        ) : (
                            <span className="tag-single-choice">Single Choice</span>
                        )}
                    </div>
                </div>

                <Divider />

                {(showResult || hasVoted || isEnded) ? (
                    // RESULT VIEW
                    <div className="poll-result-container">
                        {options.map((opt: any) => {
                            const count = opt.count || opt.vote_count || 0;
                            const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                            const optId = opt.id || opt.option_id;
                            return (
                                <div key={optId} className="poll-result-item">
                                    <div className="poll-result-header">
                                        <span className="poll-result-label">{opt.label}</span>
                                        <span className="poll-result-stats">{count} votes ({percent}%)</span>
                                    </div>
                                    <Progress percent={percent} showInfo={false} strokeColor="#1890ff" />
                                </div>
                            );
                        })}

                        <div className="text-center mt-8 text-gray-400">
                            Total Votes: {totalVotes}
                        </div>
                    </div>
                ) : (
                    // VOTE VIEW
                    <div className="vote-options-container">
                        {poll.allow_multiple ? (
                            <Checkbox.Group
                                className="poll-vote-group"
                                value={selectedOptions}
                                onChange={(vals) => setSelectedOptions(vals as number[])}
                            >
                                {options.map((opt: any) => {
                                    const optId = opt.id || opt.option_id;
                                    return (
                                        <div key={optId} className="poll-option-wrapper">
                                            <Checkbox value={optId}>{opt.label}</Checkbox>
                                        </div>
                                    );
                                })}
                            </Checkbox.Group>
                        ) : (
                            <Radio.Group
                                className="poll-vote-group"
                                value={selectedOptions[0]}
                                onChange={(e) => setSelectedOptions([e.target.value])}
                            >
                                {options.map((opt: any) => {
                                    const optId = opt.id || opt.option_id;
                                    return (
                                        <div key={optId} className="poll-option-wrapper">
                                            <Radio value={optId}>{opt.label}</Radio>
                                        </div>
                                    );
                                })}
                            </Radio.Group>
                        )}

                        <Button
                            type="primary"
                            size="large"
                            block
                            icon={<CheckCircleOutlined />}
                            onClick={handleVote}
                            loading={loading}
                            className="submit-vote-btn"
                        >
                            Submit Vote
                        </Button>

                        <div className="view-results-link">
                            <Button type="link" onClick={() => setShowResult(true)} icon={<PicLeftOutlined />}>
                                View Results Only
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PollDetail;
