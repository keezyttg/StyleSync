export interface User {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  followers: number;
  following: number;
  outfitCount: number;
  avgRating: number;
  createdAt: Date;
}

export interface ClothingItem {
  id: string;
  userId: string;
  name: string;
  brand?: string;
  category: 'Tops' | 'Bottoms' | 'Outerwear' | 'Shoes' | 'Accessories';
  size?: string;
  price?: number;
  tags: string[];
  imageURL: string;
  wornCount: number;
  costPerWear: number;
  addedAt: Date;
}

export interface Outfit {
  id: string;
  userId: string;
  imageURL: string;
  caption?: string;
  tags: string[];
  items: ClothingItem[];
  ratingTotal: number;
  ratingCount: number;
  avgRating: number;
  saves: number;
  communityId?: string;
  createdAt: Date;
}

export interface Rating {
  id: string;
  userId: string;
  outfitId: string;
  value: number; // 1-5
  createdAt: Date;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  postCount: number;
  imageURL?: string;
  tags: string[];
}

export type StyleTag =
  | 'Streetwear'
  | 'Minimalist'
  | 'Winter'
  | 'Summer'
  | 'Formal'
  | 'Casual'
  | 'Business Casual'
  | 'High Fashion'
  | 'Vintage'
  | 'Athleisure'
  | 'Cosplay'
  | '90s'
  | 'Fall'
  | 'Spring';
