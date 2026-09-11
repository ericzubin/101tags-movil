import type { ISODateString } from './common.model';

export type HomeContentPlacement = 'hero' | 'featured_category' | 'featured_media' | 'ribbon';
export type HomeContentType = 'image' | 'video' | 'animation';

export interface HomeContentCategory {
  id: number;
  slug: string;
  name: string;
}

export interface HomeContentItem {
  id: number;
  placement: HomeContentPlacement;
  type: HomeContentType;
  image: string | null;
  video: string | null;
  poster: string | null;
  alt: string | null;
  link: string | null;
  size: 'large' | 'small' | null;
  category: HomeContentCategory | null;
  title: string | null;
  subtitle: string | null;
  sortOrder: number;
  startsAt: ISODateString | null;
  endsAt: ISODateString | null;
}

export interface HomeContentByPlacement {
  hero: HomeContentItem[];
  featuredCategory: HomeContentItem[];
  featuredMedia: HomeContentItem[];
  ribbon: HomeContentItem[];
}

export interface HomeContentResponse {
  data: HomeContentByPlacement | HomeContentItem[];
}
