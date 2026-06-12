import { describe, it, expect } from "vitest";
import { transition, canTransition, availableActions, IllegalTransitionError } from "@/lib/state-machine/document-states";

describe("Document State Machine", () => {
  describe("Legal transitions", () => {
    it("DRAFT → SUBMITTED on submit", () => {
      expect(transition("DRAFT", "submit")).toBe("SUBMITTED");
    });

    it("SUBMITTED → IN_REVIEW on begin_review", () => {
      expect(transition("SUBMITTED", "begin_review")).toBe("IN_REVIEW");
    });

    it("IN_REVIEW → APPROVED on approve", () => {
      expect(transition("IN_REVIEW", "approve")).toBe("APPROVED");
    });

    it("IN_REVIEW → REJECTED on reject", () => {
      expect(transition("IN_REVIEW", "reject")).toBe("REJECTED");
    });

    it("IN_REVIEW → CHANGES_REQUESTED on request_changes", () => {
      expect(transition("IN_REVIEW", "request_changes")).toBe("CHANGES_REQUESTED");
    });

    it("CHANGES_REQUESTED → RESUBMITTED on resubmit", () => {
      expect(transition("CHANGES_REQUESTED", "resubmit")).toBe("RESUBMITTED");
    });

    it("RESUBMITTED → IN_REVIEW on begin_review", () => {
      expect(transition("RESUBMITTED", "begin_review")).toBe("IN_REVIEW");
    });

    it("APPROVED → ARCHIVED on archive", () => {
      expect(transition("APPROVED", "archive")).toBe("ARCHIVED");
    });
  });

  describe("Illegal transitions throw typed errors", () => {
    it("throws IllegalTransitionError for DRAFT → approve", () => {
      expect(() => transition("DRAFT", "approve")).toThrow(IllegalTransitionError);
    });

    it("throws on APPROVED → submit", () => {
      expect(() => transition("APPROVED", "submit")).toThrow(IllegalTransitionError);
    });

    it("throws on ARCHIVED → any action", () => {
      expect(() => transition("ARCHIVED", "submit")).toThrow(IllegalTransitionError);
      expect(() => transition("ARCHIVED", "approve")).toThrow(IllegalTransitionError);
    });

    it("throws on IN_REVIEW → resubmit (wrong role pathway)", () => {
      expect(() => transition("IN_REVIEW", "resubmit")).toThrow(IllegalTransitionError);
    });
  });

  describe("canTransition", () => {
    it("returns true for legal transition", () => {
      expect(canTransition("DRAFT", "submit")).toBe(true);
    });

    it("returns false for illegal transition", () => {
      expect(canTransition("ARCHIVED", "submit")).toBe(false);
    });
  });

  describe("availableActions", () => {
    it("returns submit for DRAFT", () => {
      expect(availableActions("DRAFT")).toContain("submit");
    });

    it("returns approve and reject for IN_REVIEW", () => {
      const actions = availableActions("IN_REVIEW");
      expect(actions).toContain("approve");
      expect(actions).toContain("reject");
      expect(actions).toContain("request_changes");
    });

    it("returns empty array for ARCHIVED", () => {
      expect(availableActions("ARCHIVED")).toHaveLength(0);
    });
  });
});
