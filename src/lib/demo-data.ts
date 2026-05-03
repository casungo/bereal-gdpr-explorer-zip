import type { BeRealData, MediaMap } from "@/lib/types";

function demoImage(label: string, background: string, accent: string): string {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="${background}"/><circle cx="690" cy="210" r="140" fill="${accent}" opacity=".75"/><rect x="120" y="660" width="660" height="260" rx="32" fill="rgba(255,255,255,.82)"/><text x="450" y="775" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#111827">${label}</text><text x="450" y="845" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#374151">Demo BeReal export</text></svg>`;
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const now = new Date("2025-03-14T19:32:00.000Z").toISOString();
const older = new Date("2024-11-02T08:15:00.000Z").toISOString();

export const demoMedia: MediaMap = {
	"Photos/demo-primary.jpg": demoImage("Primary", "#f5d0fe", "#38bdf8"),
	"Photos/demo-secondary.jpg": demoImage("Secondary", "#bbf7d0", "#f97316"),
	"Photos/demo-memory-primary.jpg": demoImage("Memory", "#fde68a", "#6366f1"),
	"Photos/demo-memory-secondary.jpg": demoImage(
		"Back Camera",
		"#bfdbfe",
		"#ef4444",
	),
	"profile-pictures/demo-profile.jpg": demoImage("BR", "#e5e7eb", "#14b8a6"),
};

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
		phoneNumber: "",
		clientVersion: "demo",
		timezone: "Europe/Paris",
		language: "en",
		countryCode: "FR",
		region: "IDF",
		platform: 1,
	},
	friends: [
		{
			id: "alex",
			username: "alex",
			fullname: "Alex Example",
			status: "friends",
			friendshipDate: "2023-02-01T10:00:00.000Z",
		},
	],
	friendRequests: [],
	posts: [
		{
			id: "demo-post",
			primary: {
				path: "Photos/demo-primary.jpg",
				bucket: "demo",
				height: 1200,
				width: 900,
				mediaType: "image",
				mimeType: "image/jpeg",
			},
			secondary: {
				path: "Photos/demo-secondary.jpg",
				bucket: "demo",
				height: 1200,
				width: 900,
				mediaType: "image",
				mimeType: "image/jpeg",
			},
			retakeCounter: 1,
			visibility: ["friends"],
			takenAt: now,
			creationDate: now,
			caption: "A sample post with location metadata.",
			location: { latitude: 48.85837, longitude: 2.294481 },
			lateInSeconds: 120,
			isMemory: false,
		},
	],
	memories: [
		{
			id: "demo-memory",
			frontImage: {
				path: "Photos/demo-memory-primary.jpg",
				bucket: "demo",
				height: 1200,
				width: 900,
				mediaType: "image",
				mimeType: "image/jpeg",
			},
			backImage: {
				path: "Photos/demo-memory-secondary.jpg",
				bucket: "demo",
				height: 1200,
				width: 900,
				mediaType: "image",
				mimeType: "image/jpeg",
			},
			primary: {
				path: "Photos/demo-memory-primary.jpg",
				bucket: "demo",
				height: 1200,
				width: 900,
				mediaType: "image",
				mimeType: "image/jpeg",
			},
			secondary: {
				path: "Photos/demo-memory-secondary.jpg",
				bucket: "demo",
				height: 1200,
				width: 900,
				mediaType: "image",
				mimeType: "image/jpeg",
			},
			isLate: false,
			date: older,
			takenTime: older,
			berealMoment: older,
			caption: "A sample memory.",
			location: { latitude: 41.890251, longitude: 12.492373 },
			isMemory: true,
			takenAt: older,
			lateInSeconds: 0,
			visibility: [],
			retakeCounter: 0,
		},
	],
	comments: [
		{
			id: "demo-comment",
			postId: "demo-post",
			text: "Looks good.",
			author: { id: "alex", username: "alex" },
			creationDate: now,
		},
	],
	realmojis: [],
	conversations: [],
	analytics: [],
	pushSettings: {},
	pushTokens: [],
	terms: [],
};
