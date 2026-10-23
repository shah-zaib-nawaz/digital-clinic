import { streamText, stepCountIs } from 'ai';
import { NextRequest } from 'next/server';
import { clinicalModel } from '@/lib/ai/models';
import { clinicalTools } from '@/lib/ai/tools';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { ChatLog } from '@/models/ChatLog';

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId = `session-${Date.now()}` } = await req.json();
    const session = await getSession();
    const userId = session?.user?.id;

    // Check if API key or Gateway is configured
    const hasApiKey =
      Boolean(process.env.OPENAI_API_KEY) ||
      Boolean(process.env.AI_GATEWAY_API_KEY);

    if (!hasApiKey) {
      // Offline fallback stream for development
      const encoder = new TextEncoder();
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              "Hello! I am your Digital Clinic AI Receptionist. I can assist you with finding specialist physicians across our Cardiology, Dermatology, Pediatrics, and Neurology departments, checking availability, and holding appointment slots. How can I help you today?"
            )
          );
          controller.close();
        },
      });

      return new Response(mockStream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const systemPrompt = `You are the empathetic, professional AI Clinical Receptionist for Digital Clinic.
Your responsibilities:
1. Help patients understand clinic services, specialties, and triage their outpatient needs.
2. Search physicians based on medical condition, symptoms, or department using the 'searchDoctors' tool.
3. Check open consultation schedules using the 'checkDoctorAvailability' tool.
4. When the patient expresses intent to book a specific doctor and time, ALWAYS invoke 'requestSlotHoldApproval' to present an HMAC-secured Human-in-the-Loop confirmation card.

STRICT MEDICAL SAFETY RULES:
- Never provide a definitive medical diagnosis or prescribe medication dosages.
- Always recommend consulting a licensed physician.
- RED FLAG TRIAGE: If the user describes sudden onset chest pressure/pain, signs of stroke (facial droop, arm weakness, speech difficulty), severe respiratory distress, or severe trauma, call 'escalateToEmergencyStaff' IMMEDIATELY and direct them to dial 911 or visit the nearest emergency room.
- Be concise, supportive, and clear.`;

    const result = streamText({
      model: clinicalModel,
      system: systemPrompt,
      messages,
      tools: clinicalTools,
      toolCallConcurrency: 1,
      stopWhen: stepCountIs(5),
      onFinish: async ({ response }) => {
        try {
          await connectDB();
          const allMessages = [
            ...messages,
            ...response.messages.map((m) => ({
              role: m.role,
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
              timestamp: new Date(),
            })),
          ];

          await ChatLog.updateOne(
            { sessionId },
            {
              $setOnInsert: {
                sessionId,
                userId: userId || null,
                createdAt: new Date(),
              },
              $set: {
                messages: allMessages,
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          );
        } catch (dbErr) {
          console.error('Failed to persist ChatLog onFinish:', dbErr);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI chat endpoint error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'AI chat processing failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
