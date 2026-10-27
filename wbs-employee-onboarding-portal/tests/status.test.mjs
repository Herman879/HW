import test from 'node:test';
import assert from 'node:assert/strict';
import { onboardingLabels, invitationLabels, mayApprove, maySendInvitation, hasHrApproval } from '../src/lib/status.ts';
const statuses = ['request_received', 'processing', 'awaiting_hr_approval','invitation_pending','invitation_sent','activated','failed'];
test('all seven statuses have German text', () => assert.ok(statuses.every(s => typeof onboardingLabels[s] === 'string')));
test('all invitation states have German text', () => assert.equal(Object.keys(invitationLabels).length, 6));
test('approval only enabled at awaiting_hr_approval', () => { for (const status of statuses) assert.equal(mayApprove(status), status === 'awaiting_hr_approval'); });
test('send only enabled at invitation_pending', () => { for (const status of statuses) assert.equal(maySendInvitation(status), status === 'invitation_pending'); });
test('approved status excludes queued & unapproved states', () => { assert.equal(hasHrApproval('processing'), false); assert.equal(hasHrApproval('invitation_pending'), true); });
