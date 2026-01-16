import React, { useState, useEffect } from 'react';
import { Modal, Avatar, Button, Typography, message, Tabs } from 'antd';
import { User, Check, UserPlus, UserMinus, UserCheck, Search, MessageSquare } from "lucide-react";
import { friendAPI, getImageUrl } from "../services/http/friend";
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

const { Text } = Typography;

interface ProfilePopupProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
    initialTab?: 'friends' | 'followers' | 'following';
}

const ProfilePopup: React.FC<ProfilePopupProps> = ({ isOpen, onClose, userId, initialTab = 'friends' }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [dataList, setDataList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [counts, setCounts] = useState({ friends: 0, followers: 0, following: 0 });
    const [myId, setMyId] = useState<number | null>(null);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await friendAPI.getMe();
                const id = res?.ID || res?.id || res?.data?.ID || res?.data?.id;
                if (id) setMyId(Number(id));
            } catch (err) { console.error("Failed to fetch me", err); }
        };
        fetchMe();
    }, []);

    useEffect(() => {
        if (isOpen && userId) {
            setActiveTab(initialTab);
            fetchData(initialTab);
            // We should also probably fetch counts if we want to show them in tabs, 
            // but for now let's just fetch the list.
        }
    }, [isOpen, userId, initialTab]);


    const fetchData = async (tab: string) => {
        setLoading(true);
        setDataList([]);
        try {
            let res;
            if (tab === 'friends') res = await friendAPI.getMemberFriends(userId);
            else if (tab === 'followers') res = await friendAPI.getMemberFollowers(userId);
            else if (tab === 'following') res = await friendAPI.getMemberFollowing(userId);

            if (res?.data?.data) {
                let list = res.data.data.map((item: any) => ({
                    ...item,
                    // Ensure ID is consistent
                    id: item.ID || item.id,
                    name: `${item.first_name} ${item.last_name}`,
                    avatar: getImageUrl(item.member_picture),
                }));

                if (myId) {
                    list.sort((a: any, b: any) => {
                        if (a.id === myId) return -1;
                        if (b.id === myId) return 1;
                        return 0;
                    });
                }

                setDataList(list);
            }
        } catch (error) {
            console.error("Fetch popup data error:", error);
            message.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (key: string) => {
        setActiveTab(key as any);
        fetchData(key);
    };

    const confirmAction = (action: () => Promise<any>, confirmTitle: string, successMsg: string, targetId: number, optimisticUpdate?: () => void) => {
        Modal.confirm({
            title: confirmTitle,
            zIndex: 3000,
            centered: true,
            onOk: async () => {
                try {
                    await action();
                    message.success(successMsg);
                    if (optimisticUpdate) optimisticUpdate();
                    else fetchData(activeTab); // Reload if no optimistic logic
                } catch (error) {
                    console.error(error);
                    message.error("เกิดข้อผิดพลาด");
                }
            }
        });
    };

    const handleFollow = (targetId: number) => {
        confirmAction(
            () => friendAPI.followUser(targetId),
            "ยืนยันการติดตาม?",
            "ติดตามเรียบร้อย",
            targetId,
        );
    };

    const handleUnfollow = (targetId: number) => {
        confirmAction(
            () => friendAPI.unfollowUser(targetId),
            "ยกเลิกการติดตาม?",
            "ยกเลิกติดตามแล้ว",
            targetId
        );
    };

    const navigateToProfile = async (user: any) => {
        onClose(); // Close popup first

        try {
            const userId = user.id;

            // Check if it's ME
            if (myId === userId) {
                navigate('/User/Profile');
                return;
            }

            // Fetch Access Control Lists
            const [friendsRes, receivedReqRes] = await Promise.all([
                friendAPI.getMyFriends(),
                friendAPI.getReceivedRequests()
            ]);

            const friendsData = (friendsRes as any)?.data || [];
            const receivedReqData = (receivedReqRes as any)?.data || [];

            // Check Friend Status
            const isFriend = friendsData.some((f: any) =>
                (f.ID || f.id || f.friend_id || f.FriendID) === userId
            );

            // Check Received Request Status
            const hasReceivedRequest = receivedReqData.some((req: any) => {
                const senderId = req.sent_mem_id ||
                    req.sent_member?.ID ||
                    req.sent_member?.id ||
                    req.sender_id ||
                    req.SenderId ||
                    req.SenderID ||
                    req.sender_mem_id ||
                    req.SenderMember?.ID ||
                    req.SenderMember?.id;
                return senderId === userId;
            });

            if (isFriend) {
                navigate('/User/Friends/FriendRelation', { state: { selectedId: userId } });
            } else if (hasReceivedRequest) {
                navigate('/User/Friends/Request', { state: { selectedId: userId } });
            } else {
                navigate('/User/Friends/Popular', { state: { selectedId: userId } });
            }

        } catch (error) {
            console.error("Navigation check failed:", error);
            // Fallback
            navigate('/User/Friends/Popular', { state: { selectedId: user.id } });
        }
    };

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            title={null}
            closable={false}
            width={480}
            centered
            className="profile-stats-popup"
            styles={{ body: { padding: 0, borderRadius: '16px', overflow: 'hidden' } }}
        >
            <div className="relative bg-white flex flex-col h-[600px] max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
                    <div className="flex gap-6 text-base font-semibold text-slate-500">
                        <span
                            className={`cursor-pointer transition-colors ${activeTab === 'friends' ? 'text-[#C42E0A] font-bold' : 'hover:text-slate-800'}`}
                            onClick={() => handleTabChange('friends')}
                        >
                            Friends
                        </span>
                        <span
                            className={`cursor-pointer transition-colors ${activeTab === 'followers' ? 'text-[#C42E0A] font-bold' : 'hover:text-slate-800'}`}
                            onClick={() => handleTabChange('followers')}
                        >
                            Followers
                        </span>
                        <span
                            className={`cursor-pointer transition-colors ${activeTab === 'following' ? 'text-[#C42E0A] font-bold' : 'hover:text-slate-800'}`}
                            onClick={() => handleTabChange('following')}
                        >
                            Following
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <CloseIcon className="text-slate-400" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">Loading...</div>
                    ) : dataList.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">No users found.</div>
                    ) : (
                        <div className="space-y-4">
                            {dataList.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors group">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer flex-1"
                                        onClick={() => navigateToProfile(item)}
                                    >
                                        <Avatar src={item.avatar} size={48} icon={<User />} className="flex-shrink-0 border border-slate-200" />
                                        <div className="min-w-0">
                                            <Text strong className="block truncate text-slate-800 group-hover:text-[#C42E0A] transition-colors">
                                                {item.name}
                                            </Text>
                                            <Text type="secondary" className="text-xs">
                                                {item.friendCount} Friends • {item.followerCount} Followers
                                            </Text>
                                        </div>
                                    </div>

                                    {/* For simple viewing of other's lists, we might not show complex Action Buttons 
                                    unless we are sure of the relationship. 
                                    Let's keep it simple: "View" implicitly via click, or maybe a distinct "View" button?
                                */}
                                    {myId === item.id ? (
                                        <div className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-md font-medium border border-slate-200">
                                            คุณ (Me)
                                        </div>
                                    ) : (
                                        <Button size="small" onClick={() => navigateToProfile(item)}>
                                            View
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
            `}</style>
        </Modal>
    );
};

export default ProfilePopup;
