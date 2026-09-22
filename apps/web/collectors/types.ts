export interface DiscoveredItem {
  url: string;
  title: string;
  publishedAt: string | null;
  summary: string | null;
  imageUrl?: string | null;
}
