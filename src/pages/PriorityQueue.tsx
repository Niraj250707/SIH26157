import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { PriorityItem } from '../types';
import {
  ListOrdered,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  ShieldAlert,
  Send,
  UserCheck,
  FileText,
  Filter,
  ArrowRight,
} from 'lucide-react';

export const PriorityQueue: React.FC = () => {
  const {
    priorityItems,
    markPriorityItemReviewed,
    escalatePriorityItem,
    navigateToEntity,
    addToast,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending Review' | 'Reviewed'>('Pending Review');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const filteredItems = priorityItems.filter((item) => {
    if (filterStatus === 'All') return true;
    return item.status === filterStatus;
  });

  const pendingCount = priorityItems.filter((i) => i.status === 'Pending Review').length;
  const reviewedCount = priorityItems.filter((i) => i.status === 'Reviewed').length;

  const handleStartEditingNotes = (item: PriorityItem) => {
    setEditingNotesId(item.id);
    setNoteInput(item.notes || '');
  };

  const handleSaveNotes = (id: string) => {
    markPriorityItemReviewed(id, noteInput);
    setEditingNotesId(null);
    setNoteInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              SUPERVISORY TRIAGE & INCIDENT QUEUE
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold font-mono">
              {pendingCount} Actions Pending
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Priority Review Queue
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Algorithmic ranking of critical sector cases requiring human supervisor determination, formal inquiry, or statutory notices.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setFilterStatus('Pending Review')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterStatus === 'Pending Review'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('Reviewed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterStatus === 'Reviewed'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Completed ({reviewedCount})
          </button>
          <button
            onClick={() => setFilterStatus('All')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterStatus === 'All'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Items ({priorityItems.length})
          </button>
        </div>
      </div>

      {/* Ranked Queue Items */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              No queue items currently in this status
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              All statutory reviews for this view have been processed by inspector staff.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isPending = item.status === 'Pending Review';
            const isEscalated = item.status === 'Escalated to Directive';

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 p-5 rounded-xl border transition-all shadow-xs space-y-4 ${
                  isPending
                    ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    : isEscalated
                    ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20'
                    : 'border-slate-200 dark:border-slate-800 opacity-90'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-2xs ${
                        item.rank <= 2
                          ? 'bg-rose-600 text-white'
                          : item.rank <= 4
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      #{item.rank}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <button
                          onClick={() => navigateToEntity(item.entityId)}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors text-sm"
                        >
                          <Building2 size={14} />
                          {item.entityName}
                        </button>
                        <span aria-hidden="true">·</span>
                        <span>{item.sector}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={12} />
                          {item.daysInQueue} days in queue
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">
                          SLA Window: {item.slaRemainingDays} days remaining
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start">
                    <RiskBadge level={item.severity} size="md" />
                    <span
                      className={`text-xs font-mono px-2.5 py-1 rounded-md border font-semibold ${
                        isPending
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50'
                          : isEscalated
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Reason Callout */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white font-semibold block mb-1">
                    Supervisory Determination Trigger:
                  </strong>
                  {item.reason}
                </div>

                {/* Supervisor Notes & Actions Bar */}
                <div className="space-y-3 pt-1">
                  {editingNotesId === item.id ? (
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        Record Inspector Determination Notes:
                      </label>
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Add supervisory comments, required corrective mandates, or rationale..."
                        rows={2}
                        className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNotes(item.id)}
                          className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md"
                        >
                          Save & Confirm Review
                        </button>
                      </div>
                    </div>
                  ) : item.notes ? (
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start justify-between gap-2">
                      <p>
                        <strong className="text-slate-700 dark:text-slate-300">Inspector Log:</strong> {item.notes}
                      </p>
                      <button
                        onClick={() => handleStartEditingNotes(item)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                  ) : null}

                  {/* Operational Button Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                      <UserCheck size={13} className="text-slate-400" />
                      Assigned: {item.assignedSupervisor}
                    </span>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleStartEditingNotes(item)}
                            className="px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Add Note
                          </button>
                          <button
                            onClick={() => escalatePriorityItem(item.id)}
                            className="px-3 py-1.5 font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/50 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1"
                          >
                            <Send size={13} />
                            Escalate Directive
                          </button>
                          <button
                            onClick={() => markPriorityItemReviewed(item.id)}
                            className="px-3.5 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 size={14} />
                            Mark as Reviewed
                          </button>
                        </>
                      )}

                      {!isPending && (
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 size={13} /> Review Action Recorded
                          </span>
                          <button
                            onClick={() => handleStartEditingNotes(item)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Update Log
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
