import { MetadataRoute } from 'next';
import { supabase } from '@/lib/db';

export const revalidate = 0;

const BASE_URL = 'https://zedbeatz.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: tracks }, { data: artists }] = await Promise.all([
    supabase.from('tracks').select('slug, id, created_at').order('created_at', { ascending: false }),
    supabase.from('artists').select('slug, id').order('name'),
  ]);

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/browse`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...(tracks ?? []).map((t) => ({
      url: `${BASE_URL}/track/${t.slug || t.id}`,
      lastModified: t.created_at ? new Date(t.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...(artists ?? []).map((a) => ({
      url: `${BASE_URL}/artist/${a.slug || a.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
