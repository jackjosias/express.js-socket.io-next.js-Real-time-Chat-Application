export interface Message {
  username: string;
  message: string;
  timestamp: string;
}

export interface UserJoinedData {
  username: string;
  users: string[];
}

export interface UserLeftData {
  username: string;
  users: string[];
}