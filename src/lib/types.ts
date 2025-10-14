export interface Media {
  bucket: string;
  height: number;
  width: number;
  path: string;
  mediaType: "image" | "video";
  mimeType: string;
}

export interface Memory {
  id?: string;
  frontImage: Media;
  backImage: Media;
  isLate: boolean;
  date: string;
  takenTime: string;
  berealMoment: string;
  caption?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  btsMedia?: Media;
  music?: {
    track: string;
    artist: string;
    openUrl: string;
    artwork: string;
    providerId: string;
    isrc: string;
    visibility: string;
    audioType: string;
    provider: string;
  };
  primary: Media;
  secondary: Media;
  video?: Media;
  takenAt?: string;
  lateInSeconds?: number;
  isMemory?: boolean;
  visibility?: string[];
  retakeCounter?: number;
}

export interface User {
  username: string;
  birthdate: {
    year: number;
    month: number;
    day: number;
  };
  fullname: string;
  clientVersion: string;
  device: string;
  deviceId: string;
  phoneNumber: string;
  profilePicture: {
    path: string;
    bucket: string;
    height: string;
    width: string;
  };
  biography: string;
  location: string;
  platform: number;
  countryCode: string;
  language: string;
  timezone: string;
  region: string;
  createdAt: string;
  id?: string;
  creationDate?: string;
}

export interface Friend {
  id: string;
  username: string;
  fullname: string;
  status: "friends" | "pending";
  friendshipDate: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id?: string;
  primary: Media;
  secondary: Media;
  retakeCounter: number;
  visibility: string[];
  takenAt: string;
  caption?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  btsMedia?: Media;
  lateInSeconds?: number;
  isMemory?: boolean;
  creationDate?: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: { id: string; username: string };
  text: string;
  creationDate: string;
}

export interface Realmoji {
  id?: string;
  createdAt: string;
  emoji: string;
  media: {
    bucket: string;
    height: number;
    width: number;
    path: string;
    mediaType: string;
  };
  isEnabled: boolean;
  creationDate?: string;
  isInstant?: boolean;
  authorId?: string;
  username?: string;
}

export interface PushSettings {
  [key: string]: boolean;
}

export interface PushToken {
  token: string;
  os: "iOS" | "Android";
  clientVersion: string;
  language: string;
  region: string;
  timezone: string;
}

export interface Term {
  code: string;
  status: string;
  version: number;
  termUrl: string;
  signedAt?: string;
  url?: string;
  date?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  creationDate: string;
  media?: {
    path: string;
    width: number;
    height: number;
    type: "image" | "video";
  };
}

export interface Conversation {
  id: string;
  participants: { id: string; username: string }[];
  messages: ChatMessage[];
}

export interface BeRealData {
  user?: User;
  friends?: Friend[];
  friendRequests?: FriendRequest[];
  posts?: Post[];
  memories?: Memory[];
  comments?: Comment[];
  realmojis?: Realmoji[];
  pushSettings?: PushSettings;
  pushTokens?: PushToken[];
  terms?: Term[];
  conversations?: Conversation[];
  analytics?: AnalyticsEvent[];
}

export type MediaMap = Record<string, string>;

export interface AnalyticsEvent {
  event_type: string;
  event_time: number;
  event_id: number;
  user_id: string;
  client_event_time: number;
  client_upload_time: number;
  city: string;
  country: string;
  region: string;
  device_type: string;
  device_family: string;
  device_id: string;
  ip_address: string;
  language: string;
  platform: string;
  version_name: string;
  os_name: string;
  user_properties: {
    gender: string | null;
    birthdayDate: string | null;
    buildNumber: string | null;
    countryCode: string | null;
  };
}

export type ProgressCallback = (progress: {
  total: number;
  loaded: number;
  message: string;
}) => void;
