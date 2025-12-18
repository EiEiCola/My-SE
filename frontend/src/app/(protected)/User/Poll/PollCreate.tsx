import React, { useEffect, useState } from "react";
import { Form, Input, Button, Checkbox, message, Card, Space, Typography, Divider } from "antd";
import { MinusCircleOutlined, PlusOutlined, SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { pollAPI } from "../../../../services/http/poll";
import "./PollCreate.css";

const { Title } = Typography;

const PollCreate: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEdit = !!id;

    useEffect(() => {
        if (isEdit && id) {
            loadPollData(Number(id));
        }
    }, [id]);

    const loadPollData = async (pollID: number) => {
        try {
            setLoading(true);
            const res = await pollAPI.getMyPollByID(pollID);
            const poll = res.data;

            form.setFieldsValue({
                question: poll.question,
                description: poll.description,
                allow_multiple: poll.allow_multiple,
                // Map options to form structure
                options: poll.options ? poll.options.map(opt => ({ label: opt.label })) : [{ label: "" }, { label: "" }],
            });
        } catch (error) {
            message.error("Failed to load poll data");
            navigate("/User/Polls/my");
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const payload = {
                question: values.question,
                description: values.description,
                allow_multiple: values.allow_multiple || false,
                options: values.options, // [{label: "A"}, {label: "B"}]
            };

            if (isEdit && id) {
                await pollAPI.updateDraft(Number(id), payload);
                message.success("Poll updated successfully");
            } else {
                await pollAPI.createDraft(payload as any);
                message.success("Draft created successfully");
            }
            navigate("/User/Polls/my");
        } catch (error) {
            console.error(error);
            message.error("Failed to save poll");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="poll-create-container">
            <Button
                icon={<ArrowLeftOutlined />}
                type="text"
                onClick={() => navigate("/User/Polls/my")}
                className="back-button"
            >
                Back to My Polls
            </Button>

            <Card title={isEdit ? "Edit Poll" : "Create New Poll"} bordered={false} className="poll-create-card">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        allow_multiple: false,
                        options: [{ label: "" }, { label: "" }] // Default 2 options
                    }}
                >
                    <Form.Item
                        name="question"
                        label="Question"
                        rules={[{ required: true, message: "Please input the question!" }]}
                    >
                        <Input placeholder="What would you like to ask?" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description (Optional)"
                    >
                        <Input.TextArea rows={3} placeholder="Add some context..." />
                    </Form.Item>

                    <Divider orientation="left">Options</Divider>

                    <Form.List
                        name="options"
                        rules={[
                            {
                                validator: async (_, names) => {
                                    if (!names || names.length < 2) {
                                        return Promise.reject(new Error('At least 2 options are required'));
                                    }
                                },
                            },
                        ]}
                    >
                        {(fields, { add, remove }, { errors }) => (
                            <>
                                {fields.map((field, index) => (
                                    <Form.Item
                                        required={false}
                                        key={field.key}
                                    >
                                        <Form.Item
                                            {...field}
                                            validateTrigger={['onChange', 'onBlur']}
                                            rules={[
                                                {
                                                    required: true,
                                                    whitespace: true,
                                                    message: "Please input option label or delete this field.",
                                                },
                                            ]}
                                            noStyle
                                        >
                                            <Input
                                                placeholder={`Option ${index + 1}`}
                                                className="poll-option-input"
                                                addonAfter={
                                                    fields.length > 2 ? (
                                                        <MinusCircleOutlined
                                                            className="dynamic-delete-button"
                                                            onClick={() => remove(field.name)}
                                                        />
                                                    ) : null
                                                }
                                            />
                                        </Form.Item>
                                    </Form.Item>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        className="add-option-btn"
                                        icon={<PlusOutlined />}
                                    >
                                        Add Option
                                    </Button>
                                    <Form.ErrorList errors={errors} />
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    <Form.Item name="allow_multiple" valuePropName="checked">
                        <Checkbox>Allow Multiple Choices</Checkbox>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} block size="large">
                            {isEdit ? "Update Poll" : "Save as Draft"}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default PollCreate;
