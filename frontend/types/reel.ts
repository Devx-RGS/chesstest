// Reel types matching backend schema

export interface ReelVideo {
    url: string;
    thumbnail: string;
    durationSec: number;
}

export interface ReelContent {
    title: string;
    description: string;
    tags: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    whitePlayer?: string;
    blackPlayer?: string;
}

export interface ReelEngagement {
    likes: number;
    comments: number;
    views: number;
    saves: number;
}

export interface Reel {
    _id: string;
    video: ReelVideo;
    content: ReelContent;
    engagement: ReelEngagement;
    gameId?: string;
    status: "draft" | "published" | "archived";
    createdAt: string;
    updatedAt: string;
}

export interface ReelResponse {
    reels: Reel[];
}
