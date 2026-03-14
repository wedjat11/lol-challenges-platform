import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChallengeStatus =
  | "PENDING_ACCEPTANCE"
  | "ACTIVE"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export interface RiotAccount {
  gameName: string;
  tagLine: string;
  region: string;
  isVerified: boolean;
  profileIconId?: number | null;
  summonerLevel?: number | null;
}

export interface ChallengeUser {
  id: string;
  username: string;
  hasRiotAccount: boolean;
  riotAccount?: RiotAccount;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  balance: number;
  hasRiotAccount: boolean;
  riotAccount?: RiotAccount;
  createdAt: string;
}

export interface ParamSchemaProperty {
  type: string;
  minimum?: number;
  maximum?: number;
  description?: string;
  enum?: string[];
}

export interface ParamSchema {
  type: string;
  properties: Record<string, ParamSchemaProperty>;
  required?: string[];
}

export interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  validatorKey: string;
  paramSchema: ParamSchema;
  rewardFormula: string;
  isActive: boolean;
}

export interface ValidationLog {
  id: string;
  challengeId: string;
  triggeredBy: string;
  result: "PASS" | "FAIL" | "ERROR" | "DEFERRED";
  reason?: string;
  matchesEvaluated: number;
  matchesQualified: number;
  createdAt: string;
}

export interface Challenge {
  id: string;
  status: ChallengeStatus;
  creatorId: string;
  targetId: string;
  creator: ChallengeUser;
  target: ChallengeUser;
  template: ChallengeTemplate;
  params: Record<string, unknown>;
  rewardAmount: number;
  expiresAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  validationLogs?: ValidationLog[];
}

export interface ChallengeListResponse {
  items: Challenge[];
  total?: number;
  nextCursor?: string;
}

export interface BalanceResponse {
  balance: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  referenceId?: string;
  referenceType?: string;
  balanceAfter: number;
  notes?: string;
  createdAt: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  nextCursor?: string;
}

export interface CreateChallengeInput {
  targetId: string;
  templateId: string;
  params: Record<string, unknown>;
  /**
   * Duration in days: 7 | 14 | 21 | 28.
   * Minimum depends on game count in params (1–5 games → 7d, 6+ games → 14d).
   * The countdown starts from acceptedAt, NOT createdAt.
   */
  durationDays: number;
}

export interface UpdateRiotAccountInput {
  gameName: string;
  tagLine: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeListResponse(data: unknown): ChallengeListResponse {
  if (Array.isArray(data)) {
    return { items: data as Challenge[] };
  }
  return data as ChallengeListResponse;
}

function normalizeTransactionResponse(data: unknown): TransactionListResponse {
  if (Array.isArray(data)) {
    return { items: data as Transaction[] };
  }
  const obj = data as Record<string, unknown>;
  // Backend returns { transactions: [...], total, limit, offset }
  if (Array.isArray(obj.transactions)) {
    return { items: obj.transactions as Transaction[] };
  }
  return data as TransactionListResponse;
}

// ─── Challenges ───────────────────────────────────────────────────────────────

// GET /challenges — first page
export function useChallenges(filters?: {
  role?: "creator" | "target";
  status?: string;
  cursor?: string;
}) {
  return useQuery<ChallengeListResponse>({
    queryKey: ["challenges", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.role) params.append("role", filters.role);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.cursor) params.append("cursor", filters.cursor);
      const res = await apiClient.get(`/challenges?${params.toString()}`);
      return normalizeListResponse(res.data);
    },
  });
}

// GET /challenges — infinite scroll
export function useChallengesInfinite(filters?: {
  role?: "creator" | "target";
  status?: string;
}) {
  return useInfiniteQuery({
    queryKey: ["challenges-infinite", filters],
    queryFn: async ({
      pageParam,
    }: {
      pageParam: string | undefined;
    }): Promise<ChallengeListResponse> => {
      const params = new URLSearchParams();
      if (filters?.role) params.append("role", filters.role);
      if (filters?.status) params.append("status", filters.status);
      if (pageParam) params.append("cursor", pageParam);
      const res = await apiClient.get(`/challenges?${params.toString()}`);
      return normalizeListResponse(res.data);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: ChallengeListResponse) =>
      lastPage.nextCursor ?? undefined,
  });
}

// GET /challenges/:id  — polls every 10 s while status is ACTIVE
export function useChallenge(id: string) {
  return useQuery<Challenge>({
    queryKey: ["challenge", id],
    queryFn: async () => {
      const res = await apiClient.get(`/challenges/${id}`);
      return res.data as Challenge;
    },
    enabled: id.length > 0,
    // Correct v5 pattern: callback receives the Query object
    refetchInterval: (query: { state: { data: unknown } }): number | false => {
      const data = query.state.data as Challenge | undefined;
      return data?.status === "ACTIVE" ? 10_000 : false;
    },
  });
}

// POST /challenges
export function useCreateChallenge() {
  const queryClient = useQueryClient();
  return useMutation<Challenge, Error, CreateChallengeInput>({
    mutationFn: async (data) => {
      const res = await apiClient.post("/challenges", data);
      return res.data as Challenge;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["challenges"] });
      void queryClient.invalidateQueries({ queryKey: ["challenges-infinite"] });
      void queryClient.invalidateQueries({ queryKey: ["economy/balance"] });
      void queryClient.invalidateQueries({ queryKey: ["users/me"] });
    },
  });
}

// POST /challenges/:id/accept
export function useAcceptChallenge() {
  const queryClient = useQueryClient();
  return useMutation<Challenge, Error, string>({
    mutationFn: async (id) => {
      const res = await apiClient.post(`/challenges/${id}/accept`);
      return res.data as Challenge;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["challenge", id] });
      void queryClient.invalidateQueries({ queryKey: ["challenges"] });
      void queryClient.invalidateQueries({ queryKey: ["challenges-infinite"] });
    },
  });
}

// POST /challenges/:id/reject
export function useRejectChallenge() {
  const queryClient = useQueryClient();
  return useMutation<Challenge, Error, string>({
    mutationFn: async (id) => {
      const res = await apiClient.post(`/challenges/${id}/reject`);
      return res.data as Challenge;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["challenge", id] });
      void queryClient.invalidateQueries({ queryKey: ["challenges"] });
      void queryClient.invalidateQueries({ queryKey: ["challenges-infinite"] });
    },
  });
}

// POST /challenges/:id/validate
export function useTriggerValidation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (id) => {
      const res = await apiClient.post(`/challenges/${id}/validate`);
      return res.data as { message: string };
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["challenge", id] });
    },
  });
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function useTemplates() {
  return useQuery<ChallengeTemplate[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await apiClient.get("/templates");
      return res.data as ChallengeTemplate[];
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

// GET /users/:id — public profile
export function useUser(id: string) {
  return useQuery<ChallengeUser>({
    queryKey: ["users", id],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${id}`);
      return res.data as ChallengeUser;
    },
    enabled: id.length > 0,
  });
}

// GET /users/me
export function useMe() {
  return useQuery<UserProfile>({
    queryKey: ["users/me"],
    queryFn: async () => {
      const res = await apiClient.get("/users/me");
      return res.data as UserProfile;
    },
  });
}

// GET /users/search
export function useSearchUsers(query: string) {
  return useQuery<ChallengeUser[]>({
    queryKey: ["users/search", query],
    queryFn: async () => {
      const res = await apiClient.get(
        `/users/search?q=${encodeURIComponent(query)}`,
      );
      return res.data as ChallengeUser[];
    },
    enabled: query.length >= 3,
  });
}

// POST /users/me/riot-account
export function useLinkRiotAccount() {
  const queryClient = useQueryClient();
  return useMutation<RiotAccount, Error, UpdateRiotAccountInput>({
    mutationFn: async (data) => {
      const res = await apiClient.post("/users/me/riot-account", data);
      return res.data as RiotAccount;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users/me"] });
    },
  });
}

// PATCH /users/me/riot-account
export function useUpdateRiotAccount() {
  const queryClient = useQueryClient();
  return useMutation<RiotAccount, Error, UpdateRiotAccountInput>({
    mutationFn: async (data) => {
      const res = await apiClient.patch("/users/me/riot-account", data);
      return res.data as RiotAccount;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users/me"] });
    },
  });
}

// ─── Economy ──────────────────────────────────────────────────────────────────

// GET /economy/balance
export function useBalance() {
  return useQuery<BalanceResponse>({
    queryKey: ["economy/balance"],
    queryFn: async () => {
      const res = await apiClient.get("/economy/balance");
      return res.data as BalanceResponse;
    },
    refetchInterval: 30_000,
  });
}

// GET /economy/transactions — infinite scroll
export function useTransactionsInfinite() {
  return useInfiniteQuery({
    queryKey: ["economy/transactions-infinite"],
    queryFn: async ({
      pageParam,
    }: {
      pageParam: string | undefined;
    }): Promise<TransactionListResponse> => {
      const params = new URLSearchParams({ limit: "20" });
      if (pageParam) params.append("cursor", pageParam);
      const res = await apiClient.get(
        `/economy/transactions?${params.toString()}`,
      );
      return normalizeTransactionResponse(res.data);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: TransactionListResponse) =>
      lastPage.nextCursor ?? undefined,
  });
}

// GET /economy/transactions — single page (legacy, used for stats)
export function useTransactions(limit = 10) {
  return useQuery<Transaction[]>({
    queryKey: ["economy/transactions", limit],
    queryFn: async () => {
      const res = await apiClient.get(`/economy/transactions?limit=${limit}`);
      const data = res.data;
      if (Array.isArray(data)) return data as Transaction[];
      return (data as TransactionListResponse).items ?? [];
    },
  });
}
