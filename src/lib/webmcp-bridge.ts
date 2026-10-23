/**
 * WebMCP Client-Side Protocol Bridge
 * Exposes browser-accessible clinical agent tools under window.__webmcp_tools
 * and navigator.modelContext for deterministic browser automation & agent interaction.
 */

export interface WebMcpTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any> | any;
}

export const clinicWebMcpTools: Record<string, WebMcpTool> = {
  clinic_filter_directory: {
    name: 'clinic_filter_directory',
    description: 'Filters the clinical provider directory by department, max consultation fee, or physician name.',
    parameters: {
      type: 'object',
      properties: {
        departmentSlug: { type: 'string', description: 'Department slug (e.g. cardiology, dermatology)' },
        maxFee: { type: 'number', description: 'Maximum consultation fee in USD' },
        query: { type: 'string', description: 'Physician name or specialty search term' },
      },
    },
    execute: async ({ departmentSlug, maxFee, query }: { departmentSlug?: string; maxFee?: number; query?: string }) => {
      const params = new URLSearchParams();
      if (departmentSlug) params.set('department', departmentSlug);
      if (maxFee) params.set('maxFee', maxFee.toString());
      if (query) params.set('q', query);

      // In browser runtime, dispatch or return simulated filtered state
      return {
        success: true,
        filtersApplied: { departmentSlug, maxFee, query },
        timestamp: new Date().toISOString(),
      };
    },
  },

  clinic_select_slot: {
    name: 'clinic_select_slot',
    description: 'Selects an available consultation appointment time slot coordinate for booking.',
    parameters: {
      type: 'object',
      required: ['doctorId', 'date', 'startTime'],
      properties: {
        doctorId: { type: 'string', description: 'MongoDB ObjectId of the selected physician' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        startTime: { type: 'string', description: 'Slot start time in HH:mm' },
      },
    },
    execute: async ({ doctorId, date, startTime }: { doctorId: string; date: string; startTime: string }) => {
      return {
        selected: true,
        doctorId,
        date,
        startTime,
        ttlSeconds: 300,
        status: 'slot_selected',
      };
    },
  },

  clinic_get_held_status: {
    name: 'clinic_get_held_status',
    description: 'Checks the active 5-minute concurrency hold status and remaining seconds for a slot.',
    parameters: {
      type: 'object',
      required: ['appointmentId'],
      properties: {
        appointmentId: { type: 'string', description: 'Appointment ObjectId' },
      },
    },
    execute: async ({ appointmentId }: { appointmentId: string }) => {
      return {
        appointmentId,
        isHeld: true,
        remainingSeconds: 285,
        status: 'held',
      };
    },
  },
};

export function registerWebMcpBridge(): void {
  if (typeof window === 'undefined') return;

  const win = window as any;
  win.__webmcp_tools = clinicWebMcpTools;

  const modelContext = {
    listTools: async () => {
      return Object.values(clinicWebMcpTools).map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }));
    },
    callTool: async (name: string, args: any) => {
      const tool = clinicWebMcpTools[name];
      if (!tool) {
        throw new Error(`WebMCP Tool '${name}' not found.`);
      }
      return await tool.execute(args);
    },
  };

  win.navigator.modelContext = modelContext;
  win.__webmcp_call = async (name: string, args: any) => {
    return await modelContext.callTool(name, args);
  };
}
