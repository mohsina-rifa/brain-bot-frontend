// Shapes captured from the live backend in SUBTASK-1.1.
// NOTE: the API envelope is NOT uniform — see the comment on each type.

/** Bots live in MongoDB and use `_id`. */
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
  /** Casing really is inconsistent with `handoverToHuman`. Not a typo. */
  handOverToHumanMessage?: string
  createdAt: string
  updatedAt: string
}

/** Q&A lives in Postgres and uses `id` (uuid), not `_id`. */
export interface Qna {
  id: string
  question: string
  answer: string
  botId: string
  createdAt: string
  updatedAt: string
}

/** A Q&A row returned by the search endpoint, with similarity scores attached. */
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

/** List endpoints: `{ page, limit, total, data }`. */
export interface Paginated<T> {
  page: number
  limit: number
  total: number
  data: T[]
}

export interface ListQuery {
  page?: number
  limit?: number
  /** Free-text search, supported by both /bots and /qna. */
  q?: string
}

/** `POST /api/auth/admin-login` → 201 (not 200), token at `data.token`. */
export interface LoginResponse {
  data: { token: string }
}

/** Errors are `{ statusCode, message }` — message is a string OR a string[]. */
export interface ApiError {
  statusCode: number
  message: string | string[]
}
