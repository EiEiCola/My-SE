//เพื่อนยอดนิยม
import React from "react";
import { ArrowLeft, Image } from "lucide-react";
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { useState } from "react";
import { useNavigate } from 'react-router-dom'


const FriendPopular: React.FC = () => {

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

 const handleAccept = (id) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: "accepted" } : req
    ));
  };

  const handleReject = (id) => {
    setRequests(requests.filter(req => req.id !== id));
  };


 const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Friend Request List */}
      <div className="w-9 bg-white flex flex-col shadow-lg border-b-0 border-l-0 border-r-1
        border-t-0 border-slate-200/50 border-solid ">
        {/* Header */}
        <div className="p-4 border-b-1 border-l-0 border-r-0
        border-t-0 border-slate-200/50 border-solid ">
          <div className="flex items-center gap-4 mb-2">
            <button className="hover:bg-orange-200 rounded-full p-1 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-700 " onClick={() => navigate('/User/Friends')}/>
            </button>
            <h1 className="text-xl font-bold text-gray-800">เพื่อนยอดนิยม</h1>
          </div>
          <div className="flex items-center justify-between ml-5">
            <p className="text-sm text-gray-600 ml-2">
              คนที่คุณอาจจะรู้จัก 
            </p>
           

          </div>
        </div>

        {/* Request List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 ">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-[17px] text-gray-800">{request.name}</h3>
                    <span className="text-xs text-gray-500">{request.date}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{request.bank}</p>

                  {/* Action Buttons */}
                  {request.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request.id)}
                        className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white py-2 rounded-full font-medium hover:from-orange-500 hover:to-orange-600 transition-all shadow-md"
                      >
                        เพิ่มเพื่อน
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-full font-medium hover:bg-gray-400 transition-all shadow-md"
                      >
                        ลบออก
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-orange-300 text-white py-2 rounded-full font-medium text-center">
                      ส่งคำขอแล้ว
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
    </div>
  );
}
    


export default FriendPopular;