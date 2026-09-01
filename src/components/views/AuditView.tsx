import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2,
  FileCode2
} from 'lucide-react';
import { Tenant, UserRole } from '../../types';
import { storageService } from '../../services/storageService';
import { Badge } from '../common/Badge';

interface AuditViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

export const AuditView: React.FC<AuditViewProps> = ({ activeTenant }) => {
  const auditLogs = storageService.getAuditLogs(activeTenant.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-800" />
            Immutable Audit Trail & Security Ledger
          </h1>
          <p className="text-xs text-slate-500">
            System actions, inventory adjustments, transaction lifecycle events, and rule executions.
          </p>
        </div>
        <Badge variant="slate">{filteredLogs.length} Events</Badge>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit actions, details, or module names..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Severity Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Module / Scope</th>
              <th className="py-3 px-4">Action Event</th>
              <th className="py-3 px-4">Execution Details</th>
              <th className="py-3 px-4">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                    {log.module_code}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">
                  {log.action}
                </td>
                <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                  {log.details}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={log.severity === 'critical' ? 'danger' : log.severity === 'warning' ? 'warning' : 'secondary'}>
                    {log.severity}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
