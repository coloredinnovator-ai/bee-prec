import "server-only";

import { getAdminServices, isAdminRuntimeLikelyReady, toIsoDate } from "@/lib/firebase/admin";
import { sampleCommunityPosts } from "@/lib/site-data";

export type CommunityPostSummary = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string | null;
};

export async function getPublicCommunityPosts(limitCount = 6): Promise<CommunityPostSummary[]> {
  if (!isAdminRuntimeLikelyReady()) {
    return sampleCommunityPosts;
  }

  try {
    const { db } = getAdminServices();
    const snapshot = await db
      .collection("communityPosts")
      .orderBy("createdAt", "desc")
      .limit(limitCount * 3)
      .get();

    if (snapshot.empty) {
      return sampleCommunityPosts;
    }

    const visiblePosts = snapshot.docs
      .map((item) => {
        const data = item.data();

        return {
          id: item.id,
          title: typeof data.title === "string" ? data.title : "Untitled post",
          body: typeof data.body === "string" ? data.body : "",
          authorName: typeof data.authorName === "string" ? data.authorName : "BEE member",
          createdAt: toIsoDate(data.createdAt),
          removed: Boolean(data.removed)
        };
      })
      .filter((item) => !item.removed)
      .slice(0, limitCount);

    return visiblePosts.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      authorName: item.authorName,
      createdAt: item.createdAt
    }));
  } catch (error) {
    console.error("Failed to load community posts", error);
    return sampleCommunityPosts;
  }
}
