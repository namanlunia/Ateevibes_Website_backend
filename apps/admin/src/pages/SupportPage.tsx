import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, Send, Lock, User, Clock, CheckCircle2, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { SupportTicket } from '../types';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchTickets = () => {
    setIsLoading(true);
    apiClient<SupportTicket[]>('support/admin/tickets')
      .then((data) => setTickets(data || []))
      .catch((err) => console.error('Failed to load tickets:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenTicket = async (ticket: SupportTicket) => {
    try {
      const details = await apiClient<SupportTicket>(`support/admin/tickets/${ticket.id}`);
      setSelectedTicket(details);
    } catch {
      setSelectedTicket(ticket);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setIsSending(true);
    try {
      await apiClient(`support/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyMessage.trim(),
          isInternalNote,
          statusUpdate: isInternalNote ? undefined : 'IN_PROGRESS',
        }),
      });
      setReplyMessage('');
      const refreshed = await apiClient<SupportTicket>(`support/admin/tickets/${selectedTicket.id}`);
      setSelectedTicket(refreshed);
      fetchTickets();
    } catch (err: any) {
      alert(`Reply error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-obsidian">Customer Service & Inquiries</h2>
        <p className="text-xs text-ink-600 mt-0.5">Manage customer inquiries, order assistance, and private internal notes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Ticket List */}
        <div className="lg:col-span-1 rounded-xl bg-white border border-sandstone shadow-subtle overflow-hidden">
          <div className="p-4 bg-ivory border-b border-sandstone flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-obsidian">Inquiry Queue</span>
            <span className="text-[11px] font-semibold text-gold bg-obsidian px-2 py-0.5 rounded-full">
              {tickets.length}
            </span>
          </div>

          <div className="divide-y divide-sandstone/40 max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <p className="p-8 text-center text-xs text-ink-500">Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <p className="p-8 text-center text-xs text-ink-500">No active tickets.</p>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleOpenTicket(t)}
                  className={`p-4 text-xs cursor-pointer transition-colors ${
                    selectedTicket?.id === t.id ? 'bg-ivory/80 border-l-4 border-gold' : 'hover:bg-ivory/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-obsidian text-[11px]">{t.ticketNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'OPEN'
                          ? 'bg-amber-100 text-amber-900'
                          : t.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-sandstone/40 text-obsidian'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="font-semibold text-obsidian line-clamp-1">{t.subject}</p>
                  <p className="text-[11px] text-ink-600 mt-0.5 truncate">{t.customerName}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Thread */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-sandstone shadow-subtle overflow-hidden flex flex-col h-[70vh]">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-4 bg-ivory border-b border-sandstone flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-gold bg-obsidian px-2 py-0.5 rounded">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-xs font-bold text-obsidian">{selectedTicket.subject}</span>
                  </div>
                  <p className="text-[11px] text-ink-600 mt-1">
                    Customer: {selectedTicket.customerName} ({selectedTicket.customerEmail})
                    {selectedTicket.orderId && ` • Order: ${selectedTicket.orderId}`}
                  </p>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                {selectedTicket.messages?.map((msg) => {
                  const isInternal = msg.isInternalNote;
                  const isStaff = msg.senderType === 'STAFF';

                  return (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl text-xs max-w-lg ${
                        isInternal
                          ? 'bg-amber-50/80 border border-amber-300 text-amber-950 ml-auto'
                          : isStaff
                          ? 'bg-obsidian text-ivory border border-gold/40 ml-auto'
                          : 'bg-ivory border border-sandstone text-obsidian mr-auto'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1 text-[10px]">
                        <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                          {isInternal && <Lock className="w-3 h-3 text-amber-700" />}
                          {isInternal ? 'Internal Atelier Note' : msg.senderName}
                        </span>
                        <span className="opacity-70 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-sandstone bg-ivory space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        !isInternalNote
                          ? 'bg-obsidian text-ivory'
                          : 'bg-white border border-sandstone text-ink-600'
                      }`}
                    >
                      Customer Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors ${
                        isInternalNote
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                          : 'bg-white border border-sandstone text-ink-600'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Internal Note</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'Write a private note visible only to atelier staff...'
                        : 'Write a response to the customer...'
                    }
                    rows={2}
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-sandstone rounded-xl focus:outline-none focus:border-gold resize-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={isSending || !replyMessage.trim()}
                    className="btn-gold px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-xl shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isSending ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ink-500">
              <MessageSquare className="w-12 h-12 text-sandstone mb-2" />
              <p className="text-sm font-semibold text-obsidian">Select an inquiry to view conversation</p>
              <p className="text-xs text-ink-500">Reply directly to customers or add private atelier notes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
