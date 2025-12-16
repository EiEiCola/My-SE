//คำขอเป็นเพื่อน
import React from "react";
import { Users, ArrowLeft, Image } from "lucide-react";
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from "react";
import { useNavigate } from 'react-router-dom'

const FriendRequest: React.FC = () => {
   const [requests, setRequests] = useState([
    { id: 1, name: "สมชาย โชติ", date: "10 ธ.ค 2568", bank: "ธนาคารกรุงเทพ 10 ตัว", status: "pending" },
    { id: 2, name: "สมชาย โชติ", date: "10 ธ.ค 2568", bank: "ธนาคารกรุงเทพ 10 ตัว", status: "pending" },
    { id: 3, name: "สมชาย โชติ", date: "10 ธ.ค 2568", bank: "ธนาคารกรุงเทพ 10 ตัว", status: "pending" },
    { id: 4, name: "สมชาย โชติ", date: "10 ธ.ค 2568", bank: "ธนาคารกรุงเทพ 10 ตัว", status: "pending" },
    { id: 5, name: "สมชาย โชติ", date: "10 ธ.ค 2568", bank: "ธนาคารกรุงเทพ 10 ตัว", status: "pending" },
    { id: 6, name: "สมชาย โชติ", date: "10 ธ.ค 2568", bank: "ธนาคารกรุงเทพ 10 ตัว", status: "pending" },
    { id: 7, name: "สมชาย โชติ", date: "10 ธ.ค 2568", bank: "ธนาคารกรุงเทพ 10 ตัว", status: "pending" },
    { id: 8, name: "สมชาย โชติ", date: "10 ธ.ค 2568", bank: "ธนาคารกรุงเทพ 10 ตัว", status: "pending" },
    { id: 9, name: "สมชาย โชติ", date: "10 ธ.ค 2568", bank: "ธนาคารกรุงเทพ 10 ตัว", status: "pending" },
    { id: 10, name: "สมชาย โชติ", date: "10 ธ.ค 2568", bank: "ธนาคารกรุงเทพ 10 ตัว", status: "pending" },
  ]);

   const [sentRequests] = useState([
    { id: 1, name: "สำนักรางวัลการรมเสลอส มหาวิทยา...", friends: "มีเพื่อนร่วมกัน 3 คน", avatar: "🎓" },
    { id: 2, name: "Thongkoon Jannongwa", friends: "มีเพื่อนร่วมกัน 5 คน", avatar: "👤" },
    { id: 3, name: "Kwan Quan", friends: "มีเพื่อนร่วมกัน 10 คน", avatar: "👥" },
    { id: 4, name: "Thanawat Srikaewsiew", friends: "มีเพื่อนร่วมกัน 9 คน", avatar: "👨" },
    { id: 5, name: "Kruawan Charurunsipong", friends: "มีเพื่อนร่วมกัน 7 คน", avatar: "🌳" },
  ]);

  const handleAccept = (id) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: "accepted" } : req
    ));
  };

  const handleReject = (id) => {
    setRequests(requests.filter(req => req.id !== id));
  };

  const [showSentModal, setShowSentModal] = useState(false);

  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Friend Request List */}
      <div className="w-96 bg-white flex flex-col border-b-0 border-l-0 border-r-1
        border-t-0 border-slate-200/50 border-solid ">
        {/* Header */}
        <div className="p-4 border-b-1 border-l-0 border-r-0
        border-t-0 border-slate-200/50 border-solid ">
          <div className="flex items-center gap-4 mb-2">
            <button className="hover:bg-orange-200 rounded-full p-1 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-700 " onClick={() => navigate('/User/Friends')}/>
            </button>
            <h1 className="text-xl font-bold text-gray-800">คำขอเป็นเพื่อน</h1>
          </div>
          <div className="flex items-center justify-between ml-10">
            <p className="text-sm text-gray-600 ml-2">
              คำขอเป็นเพื่อน {requests.filter(r => r.status === "pending").length} รายการ
            </p>
              <button 
              onClick={() => setShowSentModal(true)}
              className="text-xs text-orange-500 cursor-pointer hover:text-orange-600 font-medium">
              ดูคำขอที่ส่งแล้ว
            </button>
          </div>
        </div>

        {/* Request List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-base text-gray-800">{request.name}</h3>
                    <span className="text-xs text-gray-500">{request.date}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{request.bank}</p>

                  {/* Action Buttons */}
                  {request.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request.id)}
                        className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white py-2 rounded-full font-medium text-sm hover:from-orange-500 hover:to-orange-600 transition-all shadow-md"
                      >
                        ยืนยัน
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-full font-medium hover:bg-gray-400 transition-all shadow-md"
                      >
                        ลบ
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-green-500 text-white py-2 rounded-full font-medium text-center">
                      เพื่อน
                    </div>
                  )}
                </div>

                {/* Status */}
          
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-white-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="relative">
              <PersonSearchIcon className="w-12 h-12 text-gray-400" sx={{ fontSize: 60}}/>
        
            </div>
          </div>
          <p className="text-gray-600 font-large text-xl">เลือกชื่อของผู้คนเพื่อพรีวิวโปรไฟล์</p>
        </div>
      </div>

       {/* Sent Requests Modal */}
      {showSentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[600px] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">ส่งคำขอแล้ว</h2>
              <button
                onClick={() => setShowSentModal(false)}
                className="hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-sm text-gray-600 mb-4">
                ส่งคำขอแล้ว {sentRequests.length} รายการ
              </p>
              
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                        {request.avatar}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {request.name}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {request.friends}
                        </p>
                      </div>
                    </div>

                    {/* Cancel Button */}
                    <button className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-medium text-sm transition-colors whitespace-nowrap">
                      ยกเลิกคำขอ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendRequest;