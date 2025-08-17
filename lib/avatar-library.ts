// 头像库配置
export interface AvatarOption {
  id: string
  name: string
  url: string
  description: string
}

export const avatarLibrary: AvatarOption[] = [
  {
    id: "avatar_001",
    name: "温暖阳光",
    url: "/avatars/avatar_001.png",
    description: "温暖如春日的阳光，充满希望和活力"
  },
  {
    id: "avatar_002", 
    name: "宁静月光",
    url: "/avatars/avatar_002.png",
    description: "如月光般宁静温柔，适合内省和思考"
  },
  {
    id: "avatar_003",
    name: "活力火焰",
    url: "/avatars/avatar_003.png", 
    description: "热情似火，充满创造力和激情"
  },
  {
    id: "avatar_004",
    name: "智慧星辰",
    url: "/avatars/avatar_004.png",
    description: "如星辰般闪耀，代表智慧和洞察力"
  },
  {
    id: "avatar_005",
    name: "自然清风",
    url: "/avatars/avatar_005.png",
    description: "清新自然，如春风般舒适自在"
  },
  {
    id: "avatar_006",
    name: "梦幻彩虹",
    url: "/avatars/avatar_006.png",
    description: "多彩梦幻，充满想象力和可能性"
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

