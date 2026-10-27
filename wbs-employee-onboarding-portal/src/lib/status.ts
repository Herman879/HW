import type { OnboardingStatus, InvitationStatus } from '../api/types';

export const onboardingLabels: Record<OnboardingStatus, string> = {
  request_received: 'Anfrage eingegangen',
  processing: 'In Bearbeitung',
  awaiting_hr_approval: 'Wartet auf HR-Freigabe',
  invitation_pending: 'Einladung ausstehend',
  invitation_sent: 'Einladung versendet',
  activated: 'Aktiviert',
  failed: 'Fehlgeschlagen',
};
export const invitationLabels: Record<InvitationStatus, string> = {
  not_created: 'Nicht erstellt', pending: 'Ausstehend', sent: 'Versendet',
  expired: 'Abgelaufen', used: 'Verwendet', failed: 'Fehlgeschlagen',
};
export const statusTone: Record<OnboardingStatus, string> = {
  request_received: 'slate', processing: 'blue', awaiting_hr_approval: 'amber',
  invitation_pending: 'amber', invitation_sent: 'blue', activated: 'green', failed: 'red',
};
export function hasHrApproval(status: OnboardingStatus): boolean {
  return status === 'invitation_pending' || status === 'invitation_sent' || status === 'activated';
}
export function mayApprove(status: OnboardingStatus): boolean { return status === 'awaiting_hr_approval'; }
export function maySendInvitation(status: OnboardingStatus): boolean { return status === 'invitation_pending'; }
