export const DOCUMENT_STATES = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "RESUBMITTED",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATES)[number];

export type TransitionAction =
  | "submit"
  | "begin_review"
  | "request_changes"
  | "resubmit"
  | "approve"
  | "reject"
  | "archive";

// [fromState, action] → toState
const TRANSITION_TABLE: Record<string, DocumentStatus> = {
  "DRAFT:submit": "SUBMITTED",
  "SUBMITTED:begin_review": "IN_REVIEW",
  "IN_REVIEW:request_changes": "CHANGES_REQUESTED",
  "IN_REVIEW:approve": "APPROVED",
  "IN_REVIEW:reject": "REJECTED",
  "CHANGES_REQUESTED:resubmit": "RESUBMITTED",
  "RESUBMITTED:begin_review": "IN_REVIEW",
  "APPROVED:archive": "ARCHIVED",
  "REJECTED:archive": "ARCHIVED",
  "DRAFT:archive": "ARCHIVED",
};

export class IllegalTransitionError extends Error {
  constructor(from: DocumentStatus, action: TransitionAction) {
    super(`Illegal transition: cannot perform '${action}' from state '${from}'`);
    this.name = "IllegalTransitionError";
  }
}

export function transition(
  currentStatus: DocumentStatus,
  action: TransitionAction
): DocumentStatus {
  const key = `${currentStatus}:${action}`;
  const next = TRANSITION_TABLE[key];
  if (!next) {
    throw new IllegalTransitionError(currentStatus, action);
  }
  return next;
}

export function canTransition(
  currentStatus: DocumentStatus,
  action: TransitionAction
): boolean {
  return `${currentStatus}:${action}` in TRANSITION_TABLE;
}

export function availableActions(currentStatus: DocumentStatus): TransitionAction[] {
  return Object.keys(TRANSITION_TABLE)
    .filter((key) => key.startsWith(`${currentStatus}:`))
    .map((key) => key.split(":")[1] as TransitionAction);
}
