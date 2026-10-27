import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Plus, Search, Send, ShieldCheck, Users } from 'lucide-react';
import { api, apiMessage } from '../api/client';
import type { Employee } from '../api/types';
import { PageHeader, StatusBadge, InvitationBadge, InlineAlert } from '../components/UI';

const formatted = (date?: string) => date ? new Intl.DateTimeFormat('de-DE').format(new Date(`${date.slice(0,10)}T12:00:00`)) : '—';
export function HrPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const result = await api.listEmployees();
      if (!Array.isArray(result?.employees)) throw new Error('Ungültige Mitarbeiterliste.');
      setEmployees(result.employees);
    } catch (err) { setError(apiMessage(err)); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => employees.filter(e => `${e.first_name} ${e.last_name} ${e.personal_email} ${e.department}`.toLowerCase().includes(search.toLowerCase())), [employees, search]);
  const pendingApproval = employees.filter(e => e.status === 'awaiting_hr_approval').length;
  const sent = employees.filter(e => e.status === 'invitation_sent').length;
  const active = employees.filter(e => e.status === 'activated').length;
  return <>
    <PageHeader eyebrow="PERSONALMANAGEMENT / ÜBERSICHT" title="Mitarbeiter-Onboarding" description="Alle neuen Teammitglieder und ihre nächsten Schritte auf einen Blick." action={<Link className="button button-primary" to="/hr/new"><Plus size={18}/> Neuer Mitarbeiter</Link>} />
    <section className="kpi-grid" aria-label="Onboarding-Kennzahlen">
      <Metric icon={<Users size={21}/>} className="metric-blue" title="Mitarbeiter gesamt" value={busy ? '—' : employees.length} detail="Alle Onboarding-Prozesse" />
      <Metric icon={<Clock3 size={21}/>} className="metric-amber" title="HR-Freigabe offen" value={busy ? '—' : pendingApproval} detail="Aktion erforderlich" />
      <Metric icon={<Send size={21}/>} className="metric-orange" title="Einladungen versendet" value={busy ? '—' : sent} detail="Warten auf Aktivierung" />
      <Metric icon={<ShieldCheck size={21}/>} className="metric-green" title="Aktivierte Konten" value={busy ? '—' : active} detail="Onboarding abgeschlossen" />
    </section>
    <div className="main-panel">
      <div className="panel-heading"><div><h2>Mitarbeiterübersicht</h2><p>Verwalte Status, Freigaben und Einladungen.</p></div><div className="panel-controls"><div className="search-box"><Search size={17} /><input aria-label="Mitarbeiter suchen" placeholder="Mitarbeiter suchen …" value={search} onChange={e => setSearch(e.target.value)} /></div><button type="button" className="button button-secondary button-sm" onClick={() => void load()} disabled={busy}>Aktualisieren</button></div></div>
      {error && <div className="panel-error"><InlineAlert message={error} /></div>}
      {busy ? <div className="table-state">Mitarbeiter werden geladen …</div> : error ? <div className="table-state">Keine aktuellen Daten verfügbar. Bitte API-Verbindung prüfen.</div> : filtered.length === 0 ?
        <div className="empty-list"><div className="empty-icon"><Users size={26}/></div><h3>{search ? 'Keine Treffer' : 'Noch keine Mitarbeiter'}</h3><p>{search ? 'Bitte Suchbegriff anpassen.' : 'Lege den ersten Mitarbeiter an, um den Onboarding-Prozess zu starten.'}</p>{!search && <Link className="button button-primary" to="/hr/new"><Plus size={17} /> Mitarbeiter anlegen</Link>}</div> :
        <div className="table-scroll"><table className="employee-table"><thead><tr><th>Mitarbeiter</th><th>Abteilung / Position</th><th>Eintritt</th><th>Onboarding-Status</th><th>Einladung</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>
          {filtered.map(e => <tr key={e.id}><td><div className="employee-name"><span className="employee-avatar">{(e.first_name?.[0] || '?').toUpperCase()}{(e.last_name?.[0] || '').toUpperCase()}</span><div><strong>{e.first_name} {e.last_name}</strong><small>{e.personal_email}</small></div></div></td><td><strong>{e.department}</strong><small className="cell-muted">{e.role}</small></td><td className="date-cell">{formatted(e.start_date)}</td><td><StatusBadge status={e.status} /></td><td><InvitationBadge status={e.invitation_status} /></td><td><Link className="table-link" to={`/hr/employees/${encodeURIComponent(e.id)}`} aria-label={`Details zu ${e.first_name} ${e.last_name}`}><ArrowRight size={18}/></Link></td></tr>)}
        </tbody></table></div>}
      <div className="panel-bottom">{busy || error ? 'Keine bestätigte Anzahl' : `${filtered.length} von ${employees.length} Mitarbeitern angezeigt`}<span>Quelle: Onboarding API</span></div>
    </div>
    <div className="workflow-note"><span className="workflow-note-icon"><ShieldCheck size={18}/></span><p><strong>HR behält die Kontrolle.</strong> Einladungen werden erst nach ausdrücklicher Freigabe durch HR vom Backend versendet.</p></div>
  </>;
}
function Metric({ icon, className, title, value, detail }: { icon: React.ReactNode; className: string; title: string; value: number | string; detail: string }) {
  return <article className="metric-card"><div className="metric-top"><span className={`metric-icon ${className}`}>{icon}</span><span className="metric-spark" aria-hidden="true">···</span></div><div className="metric-number">{value}</div><div className="metric-title">{title}</div><div className="metric-detail">{detail}</div></article>;
}
