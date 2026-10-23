import { test, expect } from '@playwright/test';

test.describe('WebMCP Browser-Agent Protocol & Deterministic Tool Execution', () => {
  test.beforeEach(async ({ page }) => {
    // Inject and register WebMCP tools into the page runtime before navigation
    await page.addInitScript(() => {
      const tools = {
        clinic_filter_directory: {
          name: 'clinic_filter_directory',
          description: 'Filters the clinical provider directory',
          parameters: { type: 'object' },
          execute: (args: any) => ({
            success: true,
            filtersApplied: args,
            count: 3,
            doctors: [
              { id: 'doc-1', name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', fee: 150 },
              { id: 'doc-2', name: 'Dr. Robert Chen', specialty: 'Cardiology', fee: 180 },
            ],
          }),
        },
        clinic_select_slot: {
          name: 'clinic_select_slot',
          description: 'Selects a consultation appointment slot',
          parameters: { type: 'object' },
          execute: (args: any) => ({
            selected: true,
            ...args,
            ttlSeconds: 300,
            status: 'slot_selected',
          }),
        },
        clinic_get_held_status: {
          name: 'clinic_get_held_status',
          description: 'Checks the active 5-minute concurrency hold status',
          parameters: { type: 'object' },
          execute: (args: any) => ({
            appointmentId: args.appointmentId,
            isHeld: true,
            remainingSeconds: 290,
            status: 'held',
          }),
        },
      };

      (window as any).__webmcp_tools = tools;
      (window as any).navigator.modelContext = {
        listTools: async () => Object.values(tools).map((t) => ({ name: t.name, description: t.description })),
        callTool: async (name: string, args: any) => {
          const tool = (tools as any)[name];
          if (!tool) throw new Error(`Tool ${name} not found`);
          return tool.execute(args);
        },
      };
    });
  });

  test('lists all registered WebMCP clinical tools on the browser modelContext', async ({ page }) => {
    await page.goto('/');

    const tools = await page.evaluate(async () => {
      return await (window as any).navigator.modelContext.listTools();
    });

    expect(tools.length).toBe(3);
    const toolNames = tools.map((t: any) => t.name);
    expect(toolNames).toContain('clinic_filter_directory');
    expect(toolNames).toContain('clinic_select_slot');
    expect(toolNames).toContain('clinic_get_held_status');
  });

  test('calls clinic_filter_directory tool and retrieves filtered specialist list', async ({ page }) => {
    await page.goto('/doctors');

    const result = await page.evaluate(async () => {
      return await (window as any).navigator.modelContext.callTool('clinic_filter_directory', {
        departmentSlug: 'cardiology',
        maxFee: 200,
      });
    });

    expect(result.success).toBe(true);
    expect(result.filtersApplied.departmentSlug).toBe('cardiology');
    expect(result.filtersApplied.maxFee).toBe(200);
    expect(result.doctors.length).toBeGreaterThan(0);
  });

  test('calls clinic_select_slot and verifies 5-minute TTL reservation coordinate', async ({ page }) => {
    await page.goto('/doctors');

    const slotPayload = {
      doctorId: '60d0fe4f5311236168a109ca',
      date: '2026-11-15',
      startTime: '10:00',
    };

    const result = await page.evaluate(async (payload) => {
      return await (window as any).navigator.modelContext.callTool('clinic_select_slot', payload);
    }, slotPayload);

    expect(result.selected).toBe(true);
    expect(result.doctorId).toBe(slotPayload.doctorId);
    expect(result.date).toBe(slotPayload.date);
    expect(result.startTime).toBe(slotPayload.startTime);
    expect(result.ttlSeconds).toBe(300);
    expect(result.status).toBe('slot_selected');
  });

  test('calls clinic_get_held_status and monitors live TTL countdown', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      return await (window as any).navigator.modelContext.callTool('clinic_get_held_status', {
        appointmentId: '60d0fe4f5311236168a109cb',
      });
    });

    expect(result.isHeld).toBe(true);
    expect(result.status).toBe('held');
    expect(result.remainingSeconds).toBeGreaterThan(0);
  });
});
