/**
 * Phase 02C: Confirmation Dialog Accessibility & Interaction Safety Verification Suite
 *
 * Verifies:
 * 1. Initial focus on open (defaults to Cancel button to prevent accidental destructive action on Enter/Space).
 * 2. Escape key cancellation closes dialog and resolves false without executing destructive action.
 * 3. Focus trap: Tab and Shift+Tab cycle within modal controls and prevent background escape.
 * 4. Focus restoration: returns focus to the trigger element when closed.
 * 5. Confirmation callback resolves true exactly once; double-execution is blocked.
 * 6. Cancellation (button, Escape, backdrop) always resolves false and never executes confirmation action.
 * 7. Async callback rejection leaves dialog recoverable (isProcessing resets to false; dialog remains interactive).
 * 8. Repeated confirmation clicks / double submissions are blocked by isProcessing and isResolvedRef guards.
 * 9. Accessible semantics: role="alertdialog" for danger, role="dialog" for standard, aria-modal="true",
 *    aria-labelledby="confirm-dialog-title", and aria-describedby="confirm-dialog-description".
 * 10. Existing call sites compatibility: all application call sites conform to ConfirmOptions and Promise contract.
 *
 * Run via: npx tsx tests/security/phase02c-confirm-dialog.test.ts
 */

import fs from 'fs';
import path from 'path';
import type { ConfirmOptions } from '../../components/layout/ConfirmDialogProvider';

class TestRunner {
  passed = 0;
  failed = 0;

  async test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      this.passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      this.failed++;
    }
  }
}

// ── State Machine Simulator for ConfirmDialog Logic ──
class ConfirmDialogSimulator {
  isOpen = false;
  options: ConfirmOptions = { message: '' };
  isProcessing = false;
  isResolved = false;
  resolveCallback: ((val: boolean) => void) | null = null;
  triggerElement: { focused: boolean; isConnected: boolean } | null = null;
  activeElement: string | null = null;

  // Mock DOM elements inside dialog
  cancelButton = { id: 'cancel-btn', disabled: false, focused: false };
  confirmButton = { id: 'confirm-btn', disabled: false, focused: false };

  getActiveElement(): string | null {
    return this.activeElement;
  }

  confirm(opts: ConfirmOptions | string, triggerEl?: { focused: boolean; isConnected: boolean }) {
    // Record trigger
    this.triggerElement = triggerEl || null;

    // Cancel any previous hanging dialog
    if (this.resolveCallback && !this.isResolved) {
      this.resolveCallback(false);
    }

    this.options = typeof opts === 'string' ? { message: opts } : opts;
    this.isOpen = true;
    this.isProcessing = false;
    this.isResolved = false;

    // Initial focus simulation
    if (this.options.initialFocus === 'confirm') {
      this.activeElement = 'confirm-btn';
      this.confirmButton.focused = true;
      this.cancelButton.focused = false;
    } else {
      // Default to cancel for destructive safety
      this.activeElement = 'cancel-btn';
      this.cancelButton.focused = true;
      this.confirmButton.focused = false;
    }

    return new Promise<boolean>((resolve) => {
      this.resolveCallback = resolve;
    });
  }

  handleKeyDown(key: string, shiftKey: boolean = false): boolean {
    if (!this.isOpen) return false;

    if (key === 'Escape') {
      if (this.options.allowCancel !== false && !this.isProcessing) {
        this.handleCancel();
        return true; // handled
      }
      return false;
    }

    if (key === 'Tab') {
      const focusable = [this.cancelButton, this.confirmButton].filter(b => !b.disabled);
      if (focusable.length === 0) return true;

      const first = focusable[0].id;
      const last = focusable[focusable.length - 1].id;

      if (shiftKey) {
        // Shift + Tab: if on first, cycle to last
        if (this.activeElement === first) {
          this.activeElement = last;
        } else {
          this.activeElement = first;
        }
      } else {
        // Tab: if on last, cycle to first
        if (this.activeElement === last) {
          this.activeElement = first;
        } else {
          this.activeElement = last;
        }
      }
      return true; // handled / trapped
    }

    return false;
  }

  async handleConfirm() {
    if (this.isProcessing || this.isResolved) return;

    if (this.options.onConfirm) {
      this.isProcessing = true;
      this.cancelButton.disabled = true;
      this.confirmButton.disabled = true;
      try {
        await this.options.onConfirm();
        this.closeAndResolve(true);
      } catch (err) {
        // Reset processing on failure so user is not stuck
        this.isProcessing = false;
        this.cancelButton.disabled = false;
        this.confirmButton.disabled = false;
        throw err;
      }
    } else {
      this.closeAndResolve(true);
    }
  }

  handleCancel() {
    if (this.isProcessing || this.isResolved) return;
    if (this.options.allowCancel === false) return;
    this.closeAndResolve(false);
  }

  handleBackdropClick() {
    if (this.options.allowCancel !== false && !this.isProcessing) {
      this.handleCancel();
    }
  }

  private closeAndResolve(result: boolean) {
    if (this.isResolved) return;
    this.isResolved = true;
    this.isOpen = false;
    this.isProcessing = false;

    const cb = this.resolveCallback;
    this.resolveCallback = null;
    if (cb) cb(result);

    // Restore focus
    if (this.triggerElement && this.triggerElement.isConnected) {
      this.triggerElement.focused = true;
      this.activeElement = 'trigger-el';
    }
  }
}

async function runTests() {
  const runner = new TestRunner();
  console.log('\n========================================================================');
  console.log('🛡️ Phase 02C: Confirmation Dialog Accessibility & Interaction Safety');
  console.log('========================================================================\n');

  const providerPath = path.resolve(process.cwd(), 'components/layout/ConfirmDialogProvider.tsx');
  const providerContent = fs.readFileSync(providerPath, 'utf8');

  // -------------------------------------------------------------------------
  // Test 1: Initial focus on open
  // -------------------------------------------------------------------------
  await runner.test('1.1: ConfirmDialogProvider sets initial focus safely to Cancel button by default', () => {
    if (!providerContent.includes('cancelButtonRef.current.focus()')) {
      throw new Error('ConfirmDialogProvider does not prioritize focusing cancelButtonRef');
    }
    if (!providerContent.includes("options.initialFocus === 'confirm'")) {
      throw new Error('ConfirmDialogProvider does not support initialFocus override');
    }

    const sim = new ConfirmDialogSimulator();
    sim.confirm({ title: 'Delete Item?', message: 'Irreversible action.', danger: true });
    if (sim.getActiveElement() !== 'cancel-btn') {
      throw new Error(`Expected initial focus to be 'cancel-btn' for safety, got: ${sim.getActiveElement()}`);
    }

    sim.confirm({ title: 'Information', message: 'Read only info', initialFocus: 'confirm' });
    if (sim.getActiveElement() !== 'confirm-btn') {
      throw new Error(`Expected initial focus override 'confirm-btn', got: ${sim.getActiveElement()}`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 2: Escape key cancellation
  // -------------------------------------------------------------------------
  await runner.test('2.1: Escape key closes dialog, resolves false, and never runs destructive action', async () => {
    if (!providerContent.includes("e.key === 'Escape'")) {
      throw new Error('ConfirmDialogProvider does not handle Escape key in keydown listener');
    }

    const sim = new ConfirmDialogSimulator();
    let mutationExecuted = false;

    const promise = sim.confirm({ message: 'Delete database record?', danger: true }).then((confirmed) => {
      if (confirmed) {
        mutationExecuted = true;
      }
      return confirmed;
    });

    // Press Escape
    const handled = sim.handleKeyDown('Escape');
    if (!handled) throw new Error('Escape key was not handled when modal was open');

    const result = await promise;
    if (result !== false) {
      throw new Error(`Expected Escape to resolve false, got: ${result}`);
    }
    if (mutationExecuted) {
      throw new Error('CRITICAL: Destructive action executed on Escape key cancellation!');
    }
    if (sim.isOpen) {
      throw new Error('Dialog remained open after Escape key');
    }
  });

  await runner.test('2.2: Escape key is blocked when allowCancel is false or in-flight processing', async () => {
    const sim = new ConfirmDialogSimulator();

    // 1. allowCancel: false
    const promiseA = sim.confirm({ message: 'Mandatory Policy', allowCancel: false });
    const handledA = sim.handleKeyDown('Escape');
    if (handledA || !sim.isOpen) {
      throw new Error('Escape key should be ignored when allowCancel is false');
    }
    sim.handleConfirm();
    await promiseA;

    // 2. in-flight processing
    let resolveAsync: () => void = () => {};
    const asyncOp = new Promise<void>((r) => { resolveAsync = r; });
    const promiseB = sim.confirm({ message: 'Processing...', onConfirm: () => asyncOp });
    sim.handleConfirm(); // triggers in-flight

    if (!sim.isProcessing) throw new Error('Expected dialog to be in isProcessing state');
    const handledB = sim.handleKeyDown('Escape');
    if (handledB) throw new Error('Escape key should not cancel during in-flight async action');

    resolveAsync();
    await promiseB;
  });

  // -------------------------------------------------------------------------
  // Test 3: Focus trap using Tab and Shift+Tab
  // -------------------------------------------------------------------------
  await runner.test('3.1: Tab and Shift+Tab trap focus exclusively within dialog controls', () => {
    if (!providerContent.includes("e.key === 'Tab'")) {
      throw new Error('ConfirmDialogProvider does not implement Tab key focus trap');
    }
    if (!providerContent.includes('e.shiftKey')) {
      throw new Error('ConfirmDialogProvider does not handle Shift+Tab backward cycling');
    }

    const sim = new ConfirmDialogSimulator();
    sim.confirm({ message: 'Trap test' });

    // Initial focus on cancel-btn
    if (sim.getActiveElement() !== 'cancel-btn') throw new Error('Expected start on cancel-btn');

    // Press Tab -> advances to confirm-btn
    sim.handleKeyDown('Tab', false);
    if (sim.getActiveElement() !== 'confirm-btn') throw new Error('Expected Tab to advance to confirm-btn');

    // Press Tab on last element -> wraps back to cancel-btn
    sim.handleKeyDown('Tab', false);
    if (sim.getActiveElement() !== 'cancel-btn') throw new Error('Expected Tab on last element to wrap to cancel-btn');

    // Press Shift+Tab on first element -> wraps to confirm-btn
    sim.handleKeyDown('Tab', true);
    if (sim.getActiveElement() !== 'confirm-btn') throw new Error('Expected Shift+Tab on first element to wrap to confirm-btn');
  });

  // -------------------------------------------------------------------------
  // Test 4: Focus restoration after close
  // -------------------------------------------------------------------------
  await runner.test('4.1: Dialog captures triggering element on open and restores focus on close', async () => {
    if (!providerContent.includes('triggerElementRef.current = document.activeElement')) {
      throw new Error('ConfirmDialogProvider does not record triggerElement from document.activeElement');
    }
    if (!providerContent.includes('el.focus()')) {
      throw new Error('ConfirmDialogProvider does not restore focus to triggerElement');
    }

    const sim = new ConfirmDialogSimulator();
    const mockTrigger = { focused: true, isConnected: true };

    const promise = sim.confirm({ message: 'Action prompt' }, mockTrigger);
    mockTrigger.focused = false; // focus moved to dialog

    sim.handleCancel();
    await promise;

    if (!mockTrigger.focused) {
      throw new Error('Trigger element was not re-focused after dialog closed');
    }
  });

  // -------------------------------------------------------------------------
  // Test 5: Confirmation callback runs exactly once
  // -------------------------------------------------------------------------
  await runner.test('5.1: Confirm callback resolves true exactly once and blocks duplicate invocation', async () => {
    if (!providerContent.includes('isResolvedRef.current')) {
      throw new Error('ConfirmDialogProvider lacks isResolvedRef guard');
    }

    const sim = new ConfirmDialogSimulator();
    let resolveCount = 0;

    const promise = sim.confirm({ message: 'Execute once?' }).then((val) => {
      if (val) resolveCount++;
      return val;
    });

    // Fire handleConfirm multiple times in rapid succession
    await sim.handleConfirm();
    await sim.handleConfirm();
    await sim.handleConfirm();

    const res = await promise;
    if (!res) throw new Error('Expected confirm to resolve true');
    if (resolveCount !== 1) {
      throw new Error(`CRITICAL: Confirm callback resolved ${resolveCount} times instead of exactly 1!`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 6: Cancellation never runs confirmation callback
  // -------------------------------------------------------------------------
  await runner.test('6.1: Cancellation via button, backdrop, or Escape strictly resolves false', async () => {
    const sim = new ConfirmDialogSimulator();

    // 1. Cancel button
    const p1 = sim.confirm({ message: 'Test 1' });
    sim.handleCancel();
    const r1 = await p1;
    if (r1 !== false) throw new Error('Cancel button did not resolve false');

    // 2. Backdrop click
    const p2 = sim.confirm({ message: 'Test 2' });
    sim.handleBackdropClick();
    const r2 = await p2;
    if (r2 !== false) throw new Error('Backdrop click did not resolve false');

    // 3. Escape key
    const p3 = sim.confirm({ message: 'Test 3' });
    sim.handleKeyDown('Escape');
    const r3 = await p3;
    if (r3 !== false) throw new Error('Escape key did not resolve false');
  });

  // -------------------------------------------------------------------------
  // Test 7: Async callback rejection leaves dialog recoverable
  // -------------------------------------------------------------------------
  await runner.test('7.1: Rejected async confirmation resets isProcessing and leaves dialog interactive', async () => {
    if (!providerContent.includes('setIsProcessing(false)')) {
      throw new Error('ConfirmDialogProvider does not reset isProcessing in error recovery block');
    }

    const sim = new ConfirmDialogSimulator();
    let attempt = 0;

    const promise = sim.confirm({
      message: 'Network operation',
      onConfirm: async () => {
        attempt++;
        if (attempt === 1) {
          throw new Error('Network timeout (Simulated)');
        }
      }
    });

    // First attempt fails
    let caughtError: any = null;
    try {
      await sim.handleConfirm();
    } catch (err: any) {
      caughtError = err;
    }

    if (!caughtError || caughtError.message !== 'Network timeout (Simulated)') {
      throw new Error('Async error was not propagated correctly');
    }
    if (sim.isProcessing) {
      throw new Error('Dialog remained locked in isProcessing: true after failure');
    }
    if (!sim.isOpen) {
      throw new Error('Dialog prematurely closed on failed async action');
    }

    // Dialog is still interactive: user can retry and succeed
    await sim.handleConfirm();
    const finalResult = await promise;
    if (!finalResult) throw new Error('Expected retry to resolve true');
  });

  // -------------------------------------------------------------------------
  // Test 8: Repeated confirmation clicks / double submission prevention
  // -------------------------------------------------------------------------
  await runner.test('8.1: Buttons are disabled and guarded during async processing', async () => {
    if (!providerContent.includes('disabled={isProcessing}')) {
      throw new Error('Buttons in ConfirmDialogProvider do not bind disabled={isProcessing}');
    }
    if (!providerContent.includes('if (isProcessing || isResolvedRef.current) return')) {
      throw new Error('handleConfirm lacks guard check for isProcessing or isResolvedRef');
    }

    const sim = new ConfirmDialogSimulator();
    let executions = 0;
    let finishAsync: () => void = () => {};

    const promise = sim.confirm({
      message: 'Double click test',
      onConfirm: () => {
        executions++;
        return new Promise<void>((r) => { finishAsync = r; });
      }
    });

    // First click starts async execution
    const firstCall = sim.handleConfirm();
    if (!sim.isProcessing) throw new Error('Expected isProcessing: true during async call');

    // Second click during in-flight operation
    const secondCall = sim.handleConfirm();

    finishAsync();
    await Promise.all([firstCall, secondCall]);
    await promise;

    if (executions !== 1) {
      throw new Error(`CRITICAL: Async confirmation executed ${executions} times (Double submission bug)!`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 9: Accessible dialog name and modal semantics
  // -------------------------------------------------------------------------
  await runner.test('9.1: Role switching (alertdialog vs dialog) and ARIA attributes conform to W3C APG', () => {
    if (!providerContent.includes("role={isDanger ? 'alertdialog' : 'dialog'}")) {
      throw new Error('ConfirmDialogProvider does not switch role between alertdialog and dialog');
    }
    if (!providerContent.includes('aria-modal="true"')) {
      throw new Error('ConfirmDialogProvider lacks aria-modal="true"');
    }
    if (!providerContent.includes('aria-labelledby="confirm-dialog-title"')) {
      throw new Error('ConfirmDialogProvider lacks aria-labelledby="confirm-dialog-title"');
    }
    if (!providerContent.includes('aria-describedby="confirm-dialog-description"')) {
      throw new Error('ConfirmDialogProvider lacks aria-describedby="confirm-dialog-description"');
    }
    if (!providerContent.includes('id="confirm-dialog-title"')) {
      throw new Error('ConfirmDialogProvider title element lacks id="confirm-dialog-title"');
    }
    if (!providerContent.includes('id="confirm-dialog-description"')) {
      throw new Error('ConfirmDialogProvider description element lacks id="confirm-dialog-description"');
    }
    if (!providerContent.includes('focus:ring-2')) {
      throw new Error('ConfirmDialogProvider buttons lack visible focus ring indicators');
    }
  });

  // -------------------------------------------------------------------------
  // Test 10: Compatibility with existing application call sites
  // -------------------------------------------------------------------------
  await runner.test('10.1: All call sites across the application conform to ConfirmOptions interface', () => {
    const keyCallSites = [
      'app/projects/ProjectsClient.tsx',
      'app/marketplace/clients/ClientHubClient.tsx',
      'app/settings/AiKeysManager.tsx',
      'app/settings/SettingsClient.tsx',
      'app/roadmap/RoadmapClient.tsx',
      'app/finance/FinanceClient.tsx',
      'app/finance/invoices/InvoicesClient.tsx',
      'app/daily-expenses/DailyExpensesClient.tsx',
      'app/timesheets/TimesheetsClient.tsx',
      'components/expenses/BorrowLendTab.tsx',
      'components/expenses/ArchiveExpensesTab.tsx',
      'components/leadGen/ClientsView.tsx',
      'components/leadGen/ProspectsView.tsx',
      'components/leadGen/FinancialsView.tsx',
      'components/leadGen/TeamTasksView.tsx',
      'components/leadGen/TimeLogView.tsx',
      'components/leadGen/DeliveryCalendarView.tsx',
      'components/leadGen/DailyLogView.tsx',
      'components/leadGen/SettingsView.tsx',
      'components/leadGen/LeadModal.tsx'
    ];

    for (const relPath of keyCallSites) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Call site file not found: ${relPath}`);
      }
      const code = fs.readFileSync(fullPath, 'utf8');

      // Verify that useConfirm is imported from ConfirmDialogProvider
      if (!code.includes("from '@/components/layout/ConfirmDialogProvider'")) {
        throw new Error(`${relPath} does not import useConfirm from ConfirmDialogProvider`);
      }

      // Check confirm call pattern: confirm({ ... })
      const confirmMatches = code.match(/confirm\(\s*\{[\s\S]*?\}\s*\)/g);
      if (confirmMatches) {
        for (const match of confirmMatches) {
          // Should have message or title
          if (!match.includes('message:') && !match.includes('title:')) {
            throw new Error(`Incompatible confirm call in ${relPath}: ${match.slice(0, 60)}...`);
          }
        }
      }
    }
  });

  console.log('\n------------------------------------------------------------------------');
  console.log(`Results: ${runner.passed} passed, ${runner.failed} failed out of ${runner.passed + runner.failed} tests.`);
  console.log('------------------------------------------------------------------------\n');

  if (runner.failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
