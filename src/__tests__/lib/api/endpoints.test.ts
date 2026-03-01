import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  LoginRequest,
  RegisterRequest,
  TenderWithRelevance,
  WorkflowState,
} from "@/types";

// Mock the api client using vi.hoisted to avoid hoisting issues
const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

import {
  authApi,
  tendersApi,
  workflowApi,
  hitlApi,
  companyApi,
  healthApi,
  feedbackApi,
  costAnalyticsApi,
} from "@/lib/api/endpoints";

describe("API Endpoints", () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPost.mockClear();
    mockPut.mockClear();
    mockDelete.mockClear();
  });

  describe("authApi", () => {
    it("should login successfully", async () => {
      const loginData: LoginRequest = {
        email: "test@example.com",
        password: "password123",
      };
      const mockResponse = {
        access_token: "test-token",
        refresh_token: "refresh-token",
        user: { id: "1", email: "test@example.com" },
      };

      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await authApi.login(loginData);

      expect(mockPost).toHaveBeenCalledWith("/auth/login", loginData);
      expect(result).toEqual(mockResponse);
    });

    it("should register successfully", async () => {
      const registerData: RegisterRequest = {
        email: "new@example.com",
        password: "password123",
        full_name: "Test User",
      };
      const mockResponse = {
        access_token: "test-token",
        refresh_token: "refresh-token",
        user: { id: "1", email: "new@example.com" },
      };

      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await authApi.register(registerData);

      expect(mockPost).toHaveBeenCalledWith("/auth/register", registerData);
      expect(result).toEqual(mockResponse);
    });

    it("should get current user", async () => {
      const mockUser = { id: "1", email: "test@example.com", role: "user" };
      mockGet.mockResolvedValueOnce({ data: mockUser });

      const result = await authApi.me();

      expect(mockGet).toHaveBeenCalledWith("/auth/me");
      expect(result).toEqual(mockUser);
    });

    it("should change password", async () => {
      const passwordData = {
        current_password: "old123",
        new_password: "new123",
      };
      mockPost.mockResolvedValueOnce({ data: null });

      await authApi.changePassword(passwordData);

      expect(mockPost).toHaveBeenCalledWith(
        "/auth/change-password",
        passwordData
      );
    });

    it("should refresh token", async () => {
      const refreshToken = "refresh-token";
      const mockResponse = { access_token: "new-access-token" };
      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await authApi.refresh(refreshToken);

      expect(mockPost).toHaveBeenCalledWith("/auth/refresh", {
        refresh_token: refreshToken,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should logout", async () => {
      mockPost.mockResolvedValueOnce({ data: null });

      await authApi.logout();

      expect(mockPost).toHaveBeenCalledWith("/auth/logout");
    });
  });

  describe("tendersApi", () => {
    it("should list tenders", async () => {
      const mockTenders = [
        { id: "1", title: "Tender 1" },
        { id: "2", title: "Tender 2" },
      ];
      mockGet.mockResolvedValueOnce({ data: mockTenders });

      const result = await tendersApi.list({ limit: 10, offset: 0 });

      expect(mockGet).toHaveBeenCalledWith("/tenders", {
        params: { limit: 10, offset: 0 },
      });
      expect(result).toEqual(mockTenders);
    });

    it("should list relevant tenders", async () => {
      const mockTenders: TenderWithRelevance[] = [
        {
          id: "1",
          title: "Tender 1",
          relevance_score: 0.95,
          recommendation: "excellent",
        } as TenderWithRelevance,
      ];
      mockGet.mockResolvedValueOnce({ data: mockTenders });

      const result = await tendersApi.listRelevant({ min_score: 0.8 });

      expect(mockGet).toHaveBeenCalledWith("/tenders/relevant", {
        params: { min_score: 0.8 },
      });
      expect(result).toEqual(mockTenders);
    });

    it("should count tenders", async () => {
      const mockCount = { count: 42 };
      mockGet.mockResolvedValueOnce({ data: mockCount });

      const result = await tendersApi.count({ status: "open" });

      expect(mockGet).toHaveBeenCalledWith("/tenders/count", {
        params: { status: "open" },
      });
      expect(result).toEqual(mockCount);
    });

    it("should search tenders", async () => {
      const searchData = {
        keywords: ["web", "development"],
        domains: ["IT"],
        limit: 20,
      };
      const mockResults = [{ id: "1", title: "Web Development Tender" }];
      mockPost.mockResolvedValueOnce({ data: mockResults });

      const result = await tendersApi.search(searchData);

      expect(mockPost).toHaveBeenCalledWith("/tenders/search", searchData);
      expect(result).toEqual(mockResults);
    });

    it("should upload tender files", async () => {
      const mockFile = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const metadata = {
        title: "Test Tender",
        client: "Test Client",
        deadline: "2026-12-31",
      };
      const mockResponse = { id: "1", title: "Test Tender" };

      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await tendersApi.upload([mockFile], metadata);

      expect(mockPost).toHaveBeenCalledWith(
        "/tenders/upload",
        expect.any(FormData),
        expect.objectContaining({
          headers: { "Content-Type": undefined },
          timeout: 120000,
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should get tender details", async () => {
      const mockTender = { id: "1", title: "Tender 1", details: "..." };
      mockGet.mockResolvedValueOnce({ data: mockTender });

      const result = await tendersApi.get("1");

      expect(mockGet).toHaveBeenCalledWith("/tenders/1");
      expect(result).toEqual(mockTender);
    });

    it("should process tender", async () => {
      const mockResponse = { case_id: "case-123" };
      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await tendersApi.process("1", {
        download_dce: true,
        priority: "high",
      });

      expect(mockPost).toHaveBeenCalledWith("/tenders/1/process", {
        download_dce: true,
        priority: "high",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should get tender status", async () => {
      const mockStatus = {
        status: "processing",
        progress: 50,
        current_phase: "extraction",
      };
      mockGet.mockResolvedValueOnce({ data: mockStatus });

      const result = await tendersApi.getStatus("1");

      expect(mockGet).toHaveBeenCalledWith("/tenders/1/status");
      expect(result).toEqual(mockStatus);
    });

    it("should download document", async () => {
      const mockBlob = new Blob(["content"], { type: "application/pdf" });
      mockGet.mockResolvedValueOnce({ data: mockBlob });

      const result = await tendersApi.downloadDocument("1", "doc.pdf");

      expect(mockGet).toHaveBeenCalledWith(
        "/tenders/1/documents/doc.pdf",
        { responseType: "blob" }
      );
      expect(result).toEqual(mockBlob);
    });
  });

  describe("workflowApi", () => {
    it("should list workflow cases", async () => {
      const mockCases: WorkflowState[] = [
        {
          case_id: "case1",
          status: "running",
          current_phase: "extraction",
        } as WorkflowState,
      ];
      mockGet.mockResolvedValueOnce({ data: mockCases });

      const result = await workflowApi.listCases({
        limit: 10,
        status: "running",
      });

      expect(mockGet).toHaveBeenCalledWith("/workflow/cases", {
        params: { limit: 10, status: "running" },
      });
      expect(result).toEqual(mockCases);
    });

    it("should get case details", async () => {
      const mockCase: WorkflowState = {
        case_id: "case1",
        status: "running",
      } as WorkflowState;
      mockGet.mockResolvedValueOnce({ data: mockCase });

      const result = await workflowApi.getCase("case1");

      expect(mockGet).toHaveBeenCalledWith("/workflow/cases/case1");
      expect(result).toEqual(mockCase);
    });

    it("should resume case", async () => {
      mockPost.mockResolvedValueOnce({ data: null });

      await workflowApi.resumeCase("case1");

      expect(mockPost).toHaveBeenCalledWith("/workflow/cases/case1/resume");
    });

    it("should cancel case with reason", async () => {
      mockPost.mockResolvedValueOnce({ data: null });

      await workflowApi.cancelCase("case1", "User requested");

      expect(mockPost).toHaveBeenCalledWith(
        "/workflow/cases/case1/cancel",
        { reason: "User requested" }
      );
    });

    it("should get workflow stats", async () => {
      const mockStats = {
        total_cases: 100,
        active_cases: 10,
        completed_cases: 85,
        failed_cases: 5,
      };
      mockGet.mockResolvedValueOnce({ data: mockStats });

      const result = await workflowApi.getStats();

      expect(mockGet).toHaveBeenCalledWith("/workflow/stats");
      expect(result).toEqual(mockStats);
    });
  });

  describe("hitlApi", () => {
    it("should get pending checkpoints", async () => {
      const mockCheckpoints = [
        {
          case_id: "case1",
          checkpoint: "GO_NOGO",
          data: {},
          created_at: "2026-01-01T00:00:00Z",
        },
      ];
      mockGet.mockResolvedValueOnce({ data: mockCheckpoints });

      const result = await hitlApi.getPending("GO_NOGO");

      expect(mockGet).toHaveBeenCalledWith("/workflow/hitl/pending", {
        params: { checkpoint_type: "GO_NOGO" },
      });
      expect(result).toEqual(mockCheckpoints);
    });

    it("should get checkpoint details", async () => {
      const mockCheckpoint = {
        case_id: "case1",
        checkpoint: "GO_NOGO",
        data: { risk_score: 0.3 },
      };
      mockGet.mockResolvedValueOnce({ data: mockCheckpoint });

      const result = await hitlApi.getCheckpoint("case1", "GO_NOGO");

      expect(mockGet).toHaveBeenCalledWith("/workflow/hitl/case1/GO_NOGO");
      expect(result).toEqual(mockCheckpoint);
    });

    it("should submit decision", async () => {
      const decision = {
        action: "approve" as const,
        notes: "Looks good",
      };
      mockPost.mockResolvedValueOnce({ data: null });

      await hitlApi.submitDecision("case1", "GO_NOGO", decision);

      expect(mockPost).toHaveBeenCalledWith(
        "/workflow/hitl/case1/GO_NOGO",
        decision,
        { timeout: 60000 }
      );
    });
  });

  describe("companyApi", () => {
    it("should get current company", async () => {
      const mockCompany = { siret: "12345678900001", name: "Test Company" };
      mockGet.mockResolvedValueOnce({ data: mockCompany });

      const result = await companyApi.get();

      expect(mockGet).toHaveBeenCalledWith("/company/me");
      expect(result).toEqual(mockCompany);
    });

    it("should update company", async () => {
      const updateData = { name: "Updated Company" };
      const mockResponse = {
        siret: "12345678900001",
        name: "Updated Company",
      };
      mockPut.mockResolvedValueOnce({ data: mockResponse });

      const result = await companyApi.update("12345678900001", updateData);

      expect(mockPut).toHaveBeenCalledWith(
        "/company/12345678900001",
        updateData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("healthApi", () => {
    it("should check health", async () => {
      const mockHealth = { status: "healthy", timestamp: "2026-01-01T00:00:00Z" };
      mockGet.mockResolvedValueOnce({ data: mockHealth });

      const result = await healthApi.check();

      expect(mockGet).toHaveBeenCalledWith("/health");
      expect(result).toEqual(mockHealth);
    });

    it("should check readiness", async () => {
      const mockReady = { ready: true };
      mockGet.mockResolvedValueOnce({ data: mockReady });

      const result = await healthApi.ready();

      expect(mockGet).toHaveBeenCalledWith("/health/ready");
      expect(result).toEqual(mockReady);
    });
  });

  describe("feedbackApi", () => {
    it("should submit inline feedback", async () => {
      const feedbackData = {
        workflow_id: "wf1",
        phase: "extraction",
        element_id: "elem1",
        feedback_type: "thumbs_up" as const,
        original_value: "test",
      };
      const mockResponse = {
        id: "fb1",
        workflow_id: "wf1",
        phase: "extraction",
        element_id: "elem1",
        feedback_type: "thumbs_up" as const,
        timestamp: "2026-01-01T00:00:00Z",
        learning_triggered: false,
      };
      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await feedbackApi.submitInlineFeedback(feedbackData);

      expect(mockPost).toHaveBeenCalledWith("/feedback/inline", feedbackData);
      expect(result).toEqual(mockResponse);
    });

    it("should get realtime metrics", async () => {
      const mockMetrics = {
        total_count: 100,
        thumbs_up_count: 80,
        thumbs_down_count: 15,
        edit_count: 5,
        approval_rate: 0.8,
        negative_rate: 0.15,
        edit_rate: 0.05,
        trend_last_24h: 0.05,
        by_phase: {},
        learning_triggered: false,
      };
      mockGet.mockResolvedValueOnce({ data: mockMetrics });

      const result = await feedbackApi.getRealtimeMetrics({ hours: 24 });

      expect(mockGet).toHaveBeenCalledWith("/feedback/metrics", {
        params: { hours: 24 },
      });
      expect(result).toEqual(mockMetrics);
    });
  });

  describe("costAnalyticsApi", () => {
    it("should get cost report", async () => {
      const mockReport = {
        company_id: "comp1",
        period_start: "2026-01-01T00:00:00Z",
        period_end: "2026-01-31T23:59:59Z",
        total_cost_usd: 150.5,
        total_tokens: 1000000,
        total_calls: 500,
        avg_cost_per_call: 0.301,
        by_model: {},
        by_phase: {},
        top_workflows: [],
      };
      mockGet.mockResolvedValueOnce({ data: mockReport });

      const result = await costAnalyticsApi.getReport({ period_days: 30 });

      expect(mockGet).toHaveBeenCalledWith("/analytics/costs/report", {
        params: { period_days: 30 },
      });
      expect(result).toEqual(mockReport);
    });

    it("should get budget status", async () => {
      const mockBudget = {
        current_month_cost_usd: 120.0,
        monthly_budget_usd: 200.0,
        usage_percent: 60.0,
        remaining_usd: 80.0,
        projected_month_end_usd: 150.0,
        days_elapsed: 15,
        alert: null,
      };
      mockGet.mockResolvedValueOnce({ data: mockBudget });

      const result = await costAnalyticsApi.getBudgetStatus();

      expect(mockGet).toHaveBeenCalledWith("/analytics/costs/budget");
      expect(result).toEqual(mockBudget);
    });

    it("should track LLM call", async () => {
      const callData = {
        model: "gpt-4",
        tokens: 1000,
        workflow_id: "wf1",
        phase: "extraction",
        latency_ms: 500,
      };
      const mockResponse = {
        status: "tracked",
        model: "gpt-4",
        tokens: 1000,
        cost_usd: 0.03,
        phase: "extraction",
        company_id: null,
      };
      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await costAnalyticsApi.trackCall(callData);

      expect(mockPost).toHaveBeenCalledWith(
        "/analytics/costs/track",
        callData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("Error Handling", () => {
    it("should propagate network errors", async () => {
      const networkError = new Error("Network error");
      mockGet.mockRejectedValueOnce(networkError);

      await expect(authApi.me()).rejects.toThrow("Network error");
    });

    it("should propagate API errors", async () => {
      const apiError = {
        response: {
          status: 500,
          data: { detail: "Internal server error" },
        },
      };
      mockPost.mockRejectedValueOnce(apiError);

      await expect(
        authApi.login({ email: "test@test.com", password: "pass" })
      ).rejects.toEqual(apiError);
    });
  });

  describe("Request Formatting", () => {
    it("should format FormData for file uploads correctly", async () => {
      const mockFile = new File(["content"], "test.pdf");
      mockPost.mockResolvedValueOnce({ data: { id: "1" } });

      await tendersApi.upload([mockFile], {
        title: "Test",
        client: "Client",
        deadline: "2026-12-31",
      });

      const formDataCall = mockPost.mock.calls[0];
      expect(formDataCall[1]).toBeInstanceOf(FormData);
      expect(formDataCall[2]).toMatchObject({
        headers: { "Content-Type": undefined },
        timeout: 120000,
      });
    });

    it("should include query params correctly", async () => {
      mockGet.mockResolvedValueOnce({ data: [] });

      await tendersApi.list({
        limit: 20,
        offset: 10,
        status: "open",
        search: "test",
      });

      expect(mockGet).toHaveBeenCalledWith("/tenders", {
        params: {
          limit: 20,
          offset: 10,
          status: "open",
          search: "test",
        },
      });
    });

    it("should set responseType for blob downloads", async () => {
      mockGet.mockResolvedValueOnce({ data: new Blob() });

      await tendersApi.downloadDocument("1", "doc.pdf");

      expect(mockGet).toHaveBeenCalledWith(
        "/tenders/1/documents/doc.pdf",
        { responseType: "blob" }
      );
    });
  });

  describe("Response Transformation", () => {
    it("should return response data directly", async () => {
      const mockData = { id: "1", name: "Test" };
      mockGet.mockResolvedValueOnce({ data: mockData });

      const result = await companyApi.get();

      expect(result).toEqual(mockData);
      expect(result).not.toHaveProperty("status");
      expect(result).not.toHaveProperty("headers");
    });

    it("should handle void responses", async () => {
      mockPost.mockResolvedValueOnce({ data: null });

      const result = await authApi.logout();

      expect(result).toBeUndefined();
    });

    it("should handle blob responses", async () => {
      const mockBlob = new Blob(["content"], { type: "application/pdf" });
      mockGet.mockResolvedValueOnce({ data: mockBlob });

      const result = await tendersApi.downloadDocument("1", "doc.pdf");

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("application/pdf");
    });

    it("should handle array responses", async () => {
      const mockArray = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];
      mockGet.mockResolvedValueOnce({ data: mockArray });

      const result = await tendersApi.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });
});
