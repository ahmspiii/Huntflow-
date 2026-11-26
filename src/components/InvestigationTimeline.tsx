import { delTimelineEvent, addTimelineEvent } from "@/app/actions";
import { Clock, Plus, Trash2, Calendar, FileText } from "lucide-react";

type TimelineEventWithEvidence = {
  id: string;
  investigationId: string;
  evidenceId: string | null;
  occurredAt: Date;
  source: string;
  description: string;
  evidence?: { id: string; title: string } | null;
};

export default function InvestigationTimeline({
  investigationId,
  events,
  evidenceList,
}: {
  investigationId: string;
  events: TimelineEventWithEvidence[];
  evidenceList: { id: string; title: string }[];
}) {
  return (
    <section className="panel p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-line/40 pb-2">
        <h2 className="section-title flex items-center gap-2">
          <Clock size={14} className="text-steel" />
          Attack Flow Timeline
          <span className="badge-steel text-[11px] ml-1">{events.length}</span>
        </h2>
        <span className="text-[11px] text-muted">Chronological incident events</span>
      </div>

      {events.length > 0 ? (
        <div className="relative border-l border-line ml-2 space-y-3 py-1">
          {events.map((ev) => {
            const dateStr = new Date(ev.occurredAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={ev.id} className="relative pl-4 group">
                {/* Node marker */}
                <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-steel" />

                <div className="rounded border border-line bg-raised/20 p-2.5 hover:bg-raised/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-mono text-steel font-medium flex items-center gap-1">
                        <Calendar size={11} />
                        {dateStr}
                      </span>
                      {ev.source && (
                        <span className="badge bg-raised text-muted border border-line text-[10px]">
                          {ev.source}
                        </span>
                      )}
                      {ev.evidence && (
                        <span className="badge-steel text-[10px] flex items-center gap-1">
                          <FileText size={10} />
                          {ev.evidence.title}
                        </span>
                      )}
                    </div>
                    <form action={delTimelineEvent.bind(null, investigationId, ev.id)}>
                      <button
                        type="submit"
                        className="btn-ghost py-0.5 px-1 text-danger hover:text-danger text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete event"
                      >
                        <Trash2 size={11} />
                      </button>
                    </form>
                  </div>

                  <p className="text-xs text-text mt-1.5 leading-relaxed whitespace-pre-wrap">
                    {ev.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-muted">
          No timeline events logged yet. Record actions below to establish the attack sequence.
        </div>
      )}

      {/* Add Timeline Event Form */}
      <div className="divider" />
      <form action={addTimelineEvent.bind(null, investigationId)} className="space-y-2.5">
        <span className="text-xs font-semibold text-muted block">Log Event to Timeline</span>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="block text-[11px] text-muted sm:col-span-1">
            <span className="mb-0.5 block">Occurred At *</span>
            <input
              type="datetime-local"
              name="occurredAt"
              required
              defaultValue={new Date().toISOString().slice(0, 16)}
              className="input text-xs"
            />
          </label>
          <label className="block text-[11px] text-muted sm:col-span-1">
            <span className="mb-0.5 block">Source / Channel</span>
            <input
              name="source"
              placeholder="e.g. Sysmon, EDR, Firewall"
              className="input text-xs"
            />
          </label>
          <label className="block text-[11px] text-muted sm:col-span-1">
            <span className="mb-0.5 block">Linked Evidence</span>
            <select name="evidenceId" className="input text-xs">
              <option value="">None</option>
              {evidenceList.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <textarea
          name="description"
          required
          rows={2}
          placeholder="Attacker action or anomalous telemetry observed..."
          className="input text-xs"
        />
        <button type="submit" className="btn-primary text-xs">
          <Plus size={13} /> Add to Timeline
        </button>
      </form>
    </section>
  );
}
