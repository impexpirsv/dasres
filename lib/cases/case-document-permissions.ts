import {
  canViewPrivateCase,
  type CaseViewAccessInput,
} from "./case-view-access";

export function canAccessCaseDocuments({
  userId,
  userRole,
  customerId,
  acceptedProposalId,
  acceptedProviders,
}: CaseViewAccessInput): boolean {
  return canViewPrivateCase({
    userId,
    userRole,
    customerId,
    acceptedProposalId,
    acceptedProviders,
  });
}
