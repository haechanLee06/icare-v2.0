// 头像库配置
export interface AvatarOption {
  id: string
  url: string
}

export const avatarLibrary: AvatarOption[] = [
  {
    id: "avatar_001",
    url: "/avatars/avatar_001.png",
  },
  {
    id: "avatar_002", 
    url: "/avatars/avatar_002.png",
  }
]

// 根据ID获取头像信息
export function getAvatarById(id: string): AvatarOption | undefined {
  return avatarLibrary.find(avatar => avatar.id === id)
}

// 获取默认头像
export function getDefaultAvatar(): AvatarOption {
  return avatarLibrary[0]
}

