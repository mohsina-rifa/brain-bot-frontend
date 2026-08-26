export interface Bot {
  _id: string
  name: string
  color: string
  description: string
  icon?: string
  logo?: string
  status: 'active' | 'inactive'
  welcomeMessage?: string
  fallbackMessage?: string
  suggestionMessage?: string
  handoverToHuman?: boolean
  handOverToHumanMessage?: string
  createdAt: string
  updatedAt: string
}

export interface Qna {
  id: string
  question: string
  answer: string
  botId: string
  createdAt: string
  updatedAt: string
}

export interface QnaMatch extends Qna {
  cosine_similarity: number
  cosine_score: number
  hybrid_score: number
  combined_score: number
}

export type MessageRole = 'user' | 'bot'

export interface Message {
  role: MessageRole
  content: string
}

export interface Conversation {
  _id: string
  botId: string
  userId?: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface Paginated<T> {
  page: number
  limit: number
  total: number
  data: T[]
}

export interface ListQuery {
  page?: number
  limit?: number
  q?: string
}

export interface LoginResponse {
  data: { token: string }
}

export interface ApiError {
  statusCode: number
  message: string | string[] | Record<string, string>
}
