export const DAILY_LIMITS ={
    createRecipe: 3,
    editRecipe: 4,
    createReel: 3,
    comment: 10,
    rating: 5,
    save: 5,
    follow: 5,
    message: 10,
    reaction: 10,
    share: 5,
    block: 5,
    passwordChange: 3,
} as const

export type RateLimitAction = keyof typeof DAILY_LIMITS
