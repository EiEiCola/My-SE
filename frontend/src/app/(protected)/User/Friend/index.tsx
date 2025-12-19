//friend
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Image } from '@mui/icons-material';

interface FriendRequest {
  id: number;
  name: string;
  mutualFriends: number;
  avatar?: string;
}

interface SuggestedFriend {
  id: number;
  name: string;
  mutualFriends: number;
  avatar?: string;
}

const Friends: React.FC = () => {
  const navigate = useNavigate()
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    { id: 1, name: "สมชาย โชติ", mutualFriends: 10 },
    { id: 2, name: "สมชาย โชติ", mutualFriends: 10 },
    { id: 3, name: "สมชาย โชติ", mutualFriends: 10 },
    { id: 4, name: "สมชาย โชติ", mutualFriends: 10 },
    { id: 5, name: "สมชาย โชติ", mutualFriends: 10 },
  ]);

  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([
    { id: 1, name: "สมชาย โชติ", mutualFriends: 100 },
    { id: 2, name: "สมชาย โชติ", mutualFriends: 100 },
    { id: 3, name: "สมชาย โชติ", mutualFriends: 100 },
    { id: 4, name: "สมชาย โชติ", mutualFriends: 100 },
    { id: 5, name: "สมชาย โชติ", mutualFriends: 100 },
  ]);

   const handleAcceptRequest = (id: number) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
    // Add logic to accept friend request
  };

  const handleRejectRequest = (id: number) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
    // Add logic to reject friend request
  };

  const handleAddFriend = (id: number) => {
    setSuggestedFriends(prev => 
      prev.map(friend => 
        friend.id === id 
          ? { ...friend, avatar: 'pending' } 
          : friend
      )
    );
    // Add logic to send friend request
  };

   const handleRemoveSuggestion = (id: number) => {
    setSuggestedFriends(prev => prev.filter(friend => friend.id !== id));
    // Add logic to remove suggestion
  };

  const FriendCard = ({ 
    person, 
    type 
  }: { 
    person: FriendRequest | SuggestedFriend, 
    type: 'request' | 'suggested' 
  }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Avatar */}
      <div className="aspect-square bg-slate-100 flex items-center justify-center">
        <Image className="w-16 h-16 text-slate-300" />
      </div>
      
      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-sm mb-1">{person.name}</h3>
        <p className="text-xs text-slate-500 mb-3">
          มีเพื่อนร่วมกัน {person.mutualFriends} คน
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-2">
          {type === 'request' ? (
            <>
              <button
                onClick={() => handleAcceptRequest(person.id)}
                className="w-full py-2 bg-gradient-to-r from-orange-400 to-orange-500 
                text-white rounded-lg font-medium text-sm hover:from-orange-500 
                hover:to-orange-600 transition-all"
              >
                ยืนยัน
              </button>
              <button
                onClick={() => handleRejectRequest(person.id)}
                className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg 
                font-medium text-sm hover:bg-slate-200 transition-all"
              >
                ลบ
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleAddFriend(person.id)}
                className="w-full py-2 bg-orange-100 text-orange-600 rounded-lg 
                font-medium text-sm hover:bg-orange-200 transition-all"
              >
                เพิ่มเพื่อน
              </button>
              <button
                onClick={() => handleRemoveSuggestion(person.id)}
                className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg 
                font-medium text-sm hover:bg-slate-200 transition-all"
              >
                ลบ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );


  const ScrollableSection = ({ 
    children, 
    onNext 
  }: { 
    children: React.ReactNode, 
    onNext: () => void 
  }) => (
    <div className="relative">
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-4 min-w-max">
          {children}
        </div>
      </div>
      
      {/* Next Button */}
      <button
        onClick={onNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 
        bg-white rounded-full shadow-lg flex items-center justify-center 
        hover:bg-slate-50 transition-all z-10"
      >
        <svg 
          className="w-6 h-6 text-slate-700" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Friend Requests Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">คำขอเป็นเพื่อน</h2>
            <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg 
              text-sm font-medium hover:bg-slate-300 transition-all"
              onClick={() => navigate('/User/Friends/Request')}>
              ดูเพิ่มเติม
            </button>

           
          </div>
          
          <ScrollableSection onNext={() => console.log('Next requests')}>
            {friendRequests.map(request => (
              <div key={request.id} className="w-56 flex-shrink-0">
                <FriendCard person={request} type="request" />
              </div>
            ))}
          </ScrollableSection>
        </section>

        {/* Suggested Friends Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">เพื่อนยอดนิยม</h2>
            <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg 
              text-sm font-medium hover:bg-slate-300 transition-all"
              onClick={() => navigate('/User/Friends/Popular')}>
              ดูทั้งหมด
            </button>
          </div>
          
          <ScrollableSection onNext={() => console.log('Next suggestions')}>
            {suggestedFriends.map(friend => (
              <div key={friend.id} className="w-56 flex-shrink-0">
                <FriendCard person={friend} type="suggested" />
              </div>
            ))}
          </ScrollableSection>
        </section>

      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Friends;
