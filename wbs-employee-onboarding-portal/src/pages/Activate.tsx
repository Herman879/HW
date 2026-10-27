import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage, ApiError } from '../api/client';
import type { InvitationState, InvitationValidation } from '../api/types';
import { AuthLayout } from '../components/Layout';
import { CenterState, InlineAlert } from '../components/UI';
import { validateActivation } from '../lib/validation';

function tokenStateFromError(e: unknown): InvitationState | null {
  if (!(e instanceof ApiError)) return null;
  if (e.code === 'INVITATION_EXPIRED') return 'expired';
  if (e.code === 'INVITATION_USED') return 'used';
  if (e.code === 'INVITATION_INVALID' || e.status === 404) return 'invalid';
  return null;
}
export function ActivatePage() {
  // The invitation secret only exists in component memory, never localStorage/sessionStorage.
  const token = useRef(new URLSearchParams(window.location.search).get('token') ?? '');
  const [validation, setValidation] = useState<InvitationValidation | null>(null);
  const [checking, setChecking] = useState(true);
  const [networkError, setNetworkError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const sending = useRef(false);
  const navigate = useNavigate();

  // Immediately remove the secret from the visible address and navigation history.
  useEffect(() => { if (window.location.search.includes('token=')) window.history.replaceState(window.history.state, '', '/activate'); }, []);
  async function validate() {
    if (!token.current) { setValidation({ state: 'invalid' }); setChecking(false); return; }
    setChecking(true); setNetworkError('');
    try {
      const result = await api.validateInvitation(token.current);
      if (!['valid', 'expired', 'used', 'invalid'].includes(result?.state)) throw new Error('Ungültige Serverantwort.');
      if (result.state === 'valid' && !result.employee?.first_name) throw new Error('Einladungsdaten unvollständig.');
      setValidation(result);
    } catch (e) {
      const state = tokenStateFromError(e);
      if (state) setValidation({ state });
      else setNetworkError(apiMessage(e));
    } finally { setChecking(false); }
  }
  useEffect(() => { void validate(); /* validation only on initial invitation */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending.current || validation?.state !== 'valid') return;
    const found = validateActivation(username.trim(), password, confirmation);
    setErrors(found);
    if (Object.keys(found).length) return;
    sending.current = true; setBusy(true); setSubmissionError('');
    try {
      const result = await api.activate({ token: token.current, username: username.trim(), password });
      if (result?.activated !== true) throw new Error('Backend hat die Aktivierung nicht bestätigt.');
      token.current = '';
      setPassword(''); setConfirmation('');
      navigate('/login?activated=1', { replace: true });
    } catch (err) {
      const state = tokenStateFromError(err);
      if (state) { setValidation({ state }); token.current = ''; }
      else if (err instanceof ApiError && err.fieldErrors) { setErrors(err.fieldErrors); setSubmissionError(err.message); }
      else setSubmissionError(apiMessage(err));
    } finally { sending.current = false; setBusy(false); }
  }
  return <AuthLayout eyebrow="KONTOAKTIVIERUNG">
    {checking ? <CenterState busy title="Einladung wird geprüft" detail="Dein Link wird vom Backend validiert." /> : networkError ? <><CenterState title="Validierung nicht verfügbar" detail={networkError} action={<button className="button button-secondary" type="button" onClick={() => void validate()}>Erneut versuchen</button>} /></> : validation?.state !== 'valid' ? <><div className="auth-card-icon muted-icon"><KeyRound size={24}/></div><h2>{validation?.state === 'expired' ? 'Einladung abgelaufen' : validation?.state === 'used' ? 'Einladung bereits verwendet' : 'Einladung ungültig'}</h2><p className="auth-card-subtitle">{validation?.state === 'expired' ? 'Bitte HR um einen neuen Einladungslink.' : validation?.state === 'used' ? 'Dein Konto ist möglicherweise schon aktiviert. Melde dich an oder wende dich an HR.' : 'Der Link ist ungültig oder unvollständig. Bitte wende dich an HR.'}</p><Link className="button button-secondary auth-submit" to="/login">Zur Anmeldung <ArrowRight size={17}/></Link></> : <>
      <div className="auth-card-icon"><CheckCircle2 size={25}/></div><p className="eyebrow">EINLADUNG BESTÄTIGT</p><h2>Hallo {validation.employee?.first_name}!</h2><p className="auth-card-subtitle">Deine Einladung ist gültig. Erstelle jetzt deine Zugangsdaten für das Mitarbeiterportal.</p>
      {submissionError && <InlineAlert message={submissionError} />}
      <form className="auth-form" noValidate onSubmit={e => void submit(e)}>
        <div className="form-field"><label htmlFor="activation_username">Benutzername *</label><input id="activation_username" autoComplete="username" value={username} onChange={e => { setUsername(e.target.value); setErrors(v => ({ ...v, username: '' })); }} aria-invalid={!!errors.username} aria-describedby={errors.username ? 'activation_username-error' : undefined} placeholder="z. B. anna.mueller" required />{errors.username ? <p id="activation_username-error" className="field-error">{errors.username}</p> : <p className="field-hint">3–30 Zeichen, Buchstaben, Zahlen, Punkt, _ oder -</p>}</div>
        <div className="form-field"><label htmlFor="activation_password">Passwort *</label><div className="password-field"><input id="activation_password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'activation_password-error' : undefined} placeholder="Mindestens 12 Zeichen" required /><button type="button" aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{errors.password && <p id="activation_password-error" className="field-error">{errors.password}</p>}</div>
        <div className="form-field"><label htmlFor="activation_confirmation">Passwort bestätigen *</label><div className="password-field"><input id="activation_confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} aria-invalid={!!errors.confirmation} aria-describedby={errors.confirmation ? 'activation_confirmation-error' : undefined} placeholder="Passwort wiederholen" required /><LockKeyhole size={18} className="password-icon" /></div>{errors.confirmation && <p id="activation_confirmation-error" className="field-error">{errors.confirmation}</p>}</div>
        <button type="submit" disabled={busy} className="button button-primary auth-submit">{busy ? 'Aktivierung läuft …' : <>Konto aktivieren <ArrowRight size={18}/></>}</button>
      </form><p className="auth-card-foot">Deine Zugangsdaten werden verschlüsselt an den Server übertragen. Das Passwort wird nicht im Browser gespeichert.</p>
    </>}
  </AuthLayout>;
}
