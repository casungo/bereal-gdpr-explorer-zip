import type { BeRealData, Media, MediaMap } from "@/lib/types";

function demoImage(label: string, background: string, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="${background}"/><circle cx="690" cy="210" r="140" fill="${accent}" opacity=".75"/><rect x="120" y="660" width="660" height="260" rx="32" fill="rgba(255,255,255,.82)"/><text x="450" y="775" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#111827">${label}</text><text x="450" y="845" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#374151">Demo BeReal export</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const imagePaths = [
  "Photos/demo-primary.jpg",
  "Photos/demo-secondary.jpg",
  "Photos/demo-memory-primary.jpg",
  "Photos/demo-memory-secondary.jpg",
] as const;

export const demoMedia: MediaMap = {
  [imagePaths[0]]: demoImage("Primary", "#f5d0fe", "#38bdf8"),
  [imagePaths[1]]: demoImage("Secondary", "#bbf7d0", "#f97316"),
  [imagePaths[2]]: demoImage("Memory", "#fde68a", "#6366f1"),
  [imagePaths[3]]: demoImage("Back Camera", "#bfdbfe", "#ef4444"),
  "profile-pictures/demo-profile.jpg": demoImage("BR", "#e5e7eb", "#14b8a6"),
};

const media = (path: (typeof imagePaths)[number]): Media => ({
  path,
  bucket: "demo",
  height: 1200,
  width: 900,
  mediaType: "image",
  mimeType: "image/jpeg",
});

const names = [
  "Alex",
  "Sam",
  "Charlie",
  "Maya",
  "Noah",
  "Lina",
  "Leo",
  "Giulia",
  "Robin",
  "Taylor",
  "Camille",
  "Andrea",
];
const captions = [
  "Golden hour walk",
  "Coffee before class",
  "A very late lunch",
  "Train window views",
  "Sunday at the park",
  "Rainy day mood",
  "Dinner with friends",
  "A quiet morning",
  "Concert night",
  "Weekend by the sea",
  "Back home",
  "Just in time",
];
const eventTypes = [
  "app_open",
  "feed_viewed",
  "camera_opened",
  "bereal_posted",
  "memory_viewed",
  "profile_viewed",
  "realmoji_sent",
  "notification_opened",
  "chat_opened",
  "settings_viewed",
];
const emojis = [
  "👍",
  "😍",
  "😂",
  "😮",
  "😢",
  "🔥",
  "👏",
  "❤️",
  "🤩",
  "🥳",
  "✨",
  "🙌",
];
const baseTime = Date.parse("2025-03-14T19:32:00.000Z");
const date = (index: number, daysApart = 6) =>
  new Date(baseTime - index * daysApart * 86_400_000).toISOString();

export const demoData: BeRealData = {
  user: {
    id: "demo-user",
    username: "demo.bereal",
    fullname: "Demo User",
    createdAt: "2023-01-10T12:00:00.000Z",
    creationDate: "2023-01-10T12:00:00.000Z",
    profilePicture: {
      path: "profile-pictures/demo-profile.jpg",
      bucket: "demo",
      height: "1200",
      width: "900",
    },
    device: "iOS",
    deviceId: "demo-device",
    biography: "Sample data for exploring the app before loading an export.",
    location: "Paris, France",
    birthdate: { year: 1999, month: 7, day: 18 },
    clientVersion: "4.26.0",
    timezone: "Europe/Paris",
    language: "en",
    countryCode: "FR",
    region: "IDF",
    platform: 1,
  },
  friends: names.map((name, index) => ({
    id: `friend-${index + 1}`,
    username: name.toLowerCase(),
    fullname: `${name} Example`,
    status: "friends" as const,
    friendshipDate: date(index, 24),
  })),
  friendRequests: names.slice(0, 10).map((_, index) => ({
    id: `request-${index + 1}`,
    fromUserId: `pending-user-${index + 1}`,
    status: index % 3 === 0 ? "sent" : "received",
    createdAt: date(index, 2),
    updatedAt: date(index, 2),
  })),
  posts: captions.map((caption, index) => ({
    id: `demo-post-${index + 1}`,
    primary: media(imagePaths[index % 2]),
    secondary: media(imagePaths[(index + 1) % 2]),
    retakeCounter: index % 4,
    visibility: index % 3 === 0 ? ["friends-of-friends"] : ["friends"],
    takenAt: date(index),
    creationDate: date(index),
    caption,
    location:
      index % 2
        ? { latitude: 41.890251, longitude: 12.492373 }
        : { latitude: 48.85837, longitude: 2.294481 },
    lateInSeconds: index % 4 === 0 ? 0 : index * 45,
    isMemory: false,
  })),
  memories: captions.map((caption, index) => {
    const takenAt = date(index + 12, 18);
    const primary = media(imagePaths[2]);
    const secondary = media(imagePaths[3]);
    return {
      id: `demo-memory-${index + 1}`,
      frontImage: primary,
      backImage: secondary,
      primary,
      secondary,
      isLate: index % 4 === 0,
      date: takenAt,
      takenTime: takenAt,
      berealMoment: takenAt,
      caption: `Memory: ${caption}`,
      location: { latitude: 45.464203, longitude: 9.189982 },
      isMemory: true,
      takenAt,
      lateInSeconds: index % 4 === 0 ? 300 : 0,
      visibility: ["friends"],
      retakeCounter: index % 3,
    };
  }),
  comments: captions.map((caption, index) => ({
    id: `demo-comment-${index + 1}`,
    postId: `demo-post-${(index % captions.length) + 1}`,
    text: ["Love this!", "Great shot", "Where is this?", "So good", caption][
      index % 5
    ],
    author: {
      id: `friend-${(index % names.length) + 1}`,
      username: names[index % names.length].toLowerCase(),
    },
    creationDate: date(index, 3),
  })),
  realmojis: emojis.map((emoji, index) => ({
    id: `demo-realmoji-${index + 1}`,
    createdAt: date(index, 3),
    creationDate: date(index, 3),
    emoji,
    media: {
      ...media(imagePaths[index % imagePaths.length]),
      mediaType: "image",
    },
    isEnabled: true,
    isInstant: index % 2 === 0,
    authorId: `friend-${(index % names.length) + 1}`,
    username: names[index % names.length].toLowerCase(),
  })),
  conversations: names.slice(0, 10).map((name, index) => ({
    id: `conversation-${index + 1}`,
    participants: [
      { id: "demo-user", username: "demo.bereal" },
      { id: `friend-${index + 1}`, username: name.toLowerCase() },
    ],
    messages: [
      {
        id: `message-${index + 1}-1`,
        senderId: `friend-${index + 1}`,
        content: "Did you see today's BeReal?",
        creationDate: date(index, 2),
      },
      {
        id: `message-${index + 1}-2`,
        senderId: "demo-user",
        content: "Yes! Yours made me laugh 😄",
        creationDate: new Date(
          Date.parse(date(index, 2)) + 120_000,
        ).toISOString(),
      },
      {
        id: `message-${index + 1}-3`,
        senderId: `friend-${index + 1}`,
        content: "Let's take one together next time.",
        creationDate: new Date(
          Date.parse(date(index, 2)) + 240_000,
        ).toISOString(),
      },
    ],
  })),
  analytics: Array.from({ length: 36 }, (_, index) => ({
    event_id: index + 1,
    event_type: eventTypes[index % eventTypes.length],
    event_time: Math.floor((baseTime - index * 5 * 3_600_000) / 1000),
    user_id: "demo-user",
    city: ["Paris", "Rome", "Milan"][index % 3],
    country: ["France", "Italy", "Italy"][index % 3],
    region: ["IDF", "Lazio", "Lombardy"][index % 3],
    device_type: index % 4 === 0 ? "iPhone 15" : "iPhone 13",
    device_family: "Apple iPhone",
    language: index % 3 === 0 ? "fr" : "it",
    platform: "iOS",
    version_name: `4.${24 + (index % 3)}.0`,
    os_name: "iOS 18",
  })),
  pushSettings: {
    comments: true,
    friend_requests: true,
    friend_acceptances: true,
    realmojis: true,
    mentions: true,
    messages: true,
    bereal_time: true,
    late_posts: false,
    memories: true,
    marketing: false,
  },
  pushTokens: Array.from({ length: 10 }, (_, index) => ({
    token: `demo-token-${String(index + 1).padStart(2, "0")}-redacted`,
    os: index % 3 === 0 ? ("Android" as const) : ("iOS" as const),
    clientVersion: `4.${20 + index}.0`,
    language: index % 2 === 0 ? "en" : "fr",
    region: index % 2 === 0 ? "FR" : "IT",
    timezone: index % 2 === 0 ? "Europe/Paris" : "Europe/Rome",
  })),
  terms: [
    "terms_of_service",
    "privacy_policy",
    "community_guidelines",
    "data_processing",
    "location_services",
    "analytics_consent",
    "marketing_emails",
    "personalized_content",
    "camera_access",
    "notifications",
  ].map((code, index) => ({
    code,
    status: index === 6 ? "declined" : "accepted",
    version: 1 + (index % 3),
    termUrl: `https://bere.al/demo/${code}`,
    url: `https://bere.al/demo/${code}`,
    signedAt: date(index, 30),
    date: date(index, 30),
  })),
};
