export type AdminUserRole = "admin" | "member"

export interface AdminUserRow {
  uid: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: AdminUserRole
  profileImage: string
  bannerImage: string
  bio: string
  location: string
  website: string
  recipesCount: number
  followersCount: number
  followingCount: number
  savedRecipesCount: number
  createdAtMs: number
}