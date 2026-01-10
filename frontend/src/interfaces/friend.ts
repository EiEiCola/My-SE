export interface Member {
  ID?: number;       // Backend often sends ID (uppercase)
  id?: number;       // Frontend might use id (lowercase)
  username?: string;
  first_name?: string;
  last_name?: string;
  member_picture?: string;
  
  // Stats
  friend_count?: number;
  follower_count?: number;
  following_count?: number;
  
  // Profile Details
  bio?: string;
  dob?: string;
  gender_id?: number;
  Gender?: {
    gender_name: string;
  };
}

// UI Interface for Friend Requests
export interface FriendRequestUI {
  id: number; // Request ID
  name: string;
  avatar: string;
}

// UI Interface for Suggested Friends (Popular/Search)
export interface SuggestedFriendUI {
  id: number; // Member ID
  name: string;
  avatar: string;
  mutualFriends?: number; // follower_count in your case
  status: 'none' | 'pending' | 'friends';
  requestId?: number;
  isFollowing: boolean;
}

// UI Interface for Friend List & Search Results
export interface FriendItem {
  id: number;
  name: string;
  username: string;
  avatar: string;

  // Stats
  friendCount: number;
  followerCount: number;
  followingCount: number;

  // Profile
  bio: string;
  gender: string;
  dob: string;

  // Status
  isFollowing: boolean;
}

// Standard API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}