'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  X,
  Send,
  Loader2,
  CalendarCheck2,
  AlertTriangle,
  Sparkles,
  Lock,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { executeApprovedSlotHoldAction } from '@/actions/ai-hitl.actions';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  approvalCard?: {
    doctorId: string;
    doctorName: string;
    date: string;
    startTime: string;
    endTime: string;
    consultationFee: number;
    approvalToken: string;
    summary: string;
  };
  isEmergency?: boolean;
}

export function ReceptionistWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [sessionId] = React.useState(
    () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [holdingSlot, setHoldingSlot] = React.useState<string | null>(null);
  const [heldAppointmentId, setHeldAppointmentId] = React.useState<string | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = `assistant-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    setMessages([...newMessages, initialAssistantMessage]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI service responded with HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No readable response body returned');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, content: accumulatedText } : m
          )
        );
      }

      // Check if text triggers emergency keywords
      const isEmergency =
        accumulatedText.toLowerCase().includes('emergency') ||
        accumulatedText.includes('911');

      if (isEmergency) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, isEmergency: true } : m))
        );
      }
    } catch (err: any) {
      console.error('Chat stream error:', err);
      toast.error('AI Receptionist error: ' + (err.message || 'Please try again.'));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content:
                  'I apologize, but I encountered a momentary connection interruption. Please consult our directory directly or dial patient care.',
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteHold = async (approvalToken: string, summary: string) => {
    try {
      setHoldingSlot(approvalToken);
      const res = await executeApprovedSlotHoldAction({
        approvalToken,
        chiefComplaint: summary,
        sessionId,
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to hold slot. It may have just been booked.');
        return;
      }

      setHeldAppointmentId(res.data?._id?.toString() || res.data?.id || null);
      toast.success('Slot successfully held for 5 minutes! Proceeding to confirmation.');
    } catch (err: any) {
      toast.error(err.message || 'Error executing slot hold');
    } finally {
      setHoldingSlot(null);
    }
  };

  const quickPrompts = [
    'Find a Cardiologist',
    'I have skin rash symptoms',
    'Who is available tomorrow?',
    'What are consultation fees?',
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="relative h-14 w-14 rounded-full shadow-2xl p-0 bg-primary hover:bg-primary/90 text-primary-foreground group transition-all duration-300 hover:scale-105"
          aria-label="Open AI Clinic Receptionist"
        >
          <Bot className="h-7 w-7 transition-transform group-hover:rotate-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background" />
          </span>
        </Button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[580px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="px-4 py-3.5 bg-muted/60 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-foreground">AI Clinic Receptionist</h3>
                  <Badge variant="outline" className="text-[10px] h-4 px-1 border-primary/30 text-primary">
                    Triage v7
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">Empathetic outpatient triage & booking</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              aria-label="Close receptionist chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Feed */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-foreground leading-relaxed">
                  <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
                    <Sparkles className="h-4 w-4" />
                    <span>Welcome to Digital Clinic</span>
                  </div>
                  I am your automated clinical triage assistant. I can help find appropriate physicians, check real-time open slots, and hold appointments for 5 minutes.
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                    Suggested Questions
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="text-left p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted text-xs text-foreground transition-colors leading-snug line-clamp-2"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted/70 text-foreground border border-border/40 rounded-bl-none whitespace-pre-wrap'
                  }`}
                >
                  {m.content}
                </div>

                {/* Emergency Escalation Notice */}
                {m.isEmergency && (
                  <div className="w-full mt-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 space-y-1.5 text-xs text-destructive dark:text-destructive-foreground shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Clinical Emergency Flagged</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      If you are experiencing severe symptoms, please dial 911 or visit the nearest emergency room immediately.
                    </p>
                  </div>
                )}

                {/* HITL Slot Hold Card if available */}
                {m.approvalCard && (
                  <div className="w-full mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                        <Lock className="h-3.5 w-3.5" />
                        Cryptographic HITL Approval
                      </span>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        5-Min Lock
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-foreground">{m.approvalCard.doctorName}</p>
                      <p className="text-muted-foreground text-[11px]">
                        📅 {m.approvalCard.date} • ⏰ {m.approvalCard.startTime} - {m.approvalCard.endTime}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Consultation Fee: <span className="font-semibold text-foreground">${m.approvalCard.consultationFee}</span>
                      </p>
                    </div>

                    {heldAppointmentId ? (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Slot Reserved!
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2 gap-1 text-emerald-700 dark:text-emerald-400"
                          onClick={() => router.push('/patient/appointments')}
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
                        disabled={holdingSlot === m.approvalCard.approvalToken}
                        onClick={() => handleExecuteHold(m.approvalCard!.approvalToken, m.approvalCard!.summary)}
                      >
                        {holdingSlot === m.approvalCard.approvalToken ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Locking Slot in MongoDB...
                          </>
                        ) : (
                          <>
                            <CalendarCheck2 className="h-3.5 w-3.5" />
                            Authorize & Lock Slot (5 min)
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>AI Receptionist is checking clinical records...</span>
              </div>
            )}
          </div>

          {/* Footer Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-border bg-muted/30 flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about doctors, symptoms, or slots..."
              className="flex-1 h-9 text-xs bg-background"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0 bg-primary text-primary-foreground"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
