import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getLeadGenFullState } from '@/lib/leadGenStore';

export async function GET() {
  try {
    const state = await getLeadGenFullState();

    // Create workbook
    const wb = XLSX.utils.book_new();

    // 1. Prospects Sheet
    const prospectsData = state.prospects.map((p) => ({
      ID: p.id,
      Company: p.company,
      City: p.city,
      State: p.state,
      Website: p.website,
      'Business Email': p.businessEmail,
      'Email Verified': p.emailVerified,
      'Maps Rank': p.mapsRank,
      'Review Count': p.reviewCount,
      Rating: p.rating,
      'Profile Gap': p.gap,
      Status: p.status,
      'Reply Tag': p.replyTag,
      'Last Contact': p.lastContact || '',
      'Next Follow-Up': p.nextFollowUp || '',
      Notes: p.notes || '',
    }));
    const wsProspects = XLSX.utils.json_to_sheet(prospectsData);
    XLSX.utils.book_append_sheet(wb, wsProspects, 'Prospects');

    // 2. Daily Log Sheet
    const dailyData = state.dailyLogs.map((d) => ({
      Date: d.date,
      'Emails Sent': d.emailsSent,
      Bounced: d.bounced,
      Replies: d.replies,
      'Positive Replies': d.positiveReplies,
      'Audits Sent': d.auditsSent,
      'Calls Booked': d.callsBooked,
      'Bounce Rate': d.emailsSent ? `${((d.bounced / d.emailsSent) * 100).toFixed(1)}%` : '0%',
      'Reply Rate': d.emailsSent ? `${((d.replies / d.emailsSent) * 100).toFixed(1)}%` : '0%',
      Note: d.note || '',
    }));
    const wsDaily = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Log');

    // 3. Clients Sheet
    const clientsData = state.clients.map((c) => ({
      Client: c.name,
      'Start Date': c.startDate,
      'Monthly Retainer ($)': c.monthlyRetainer,
      Services: c.services,
      'Hours (Month)': c.hoursReportMonth || 0,
      'Effective $/hour': c.hoursReportMonth && c.hoursReportMonth > 0 ? (c.monthlyRetainer / c.hoursReportMonth).toFixed(2) : 'N/A',
      Status: c.status,
      Notes: c.notes || '',
    }));
    const wsClients = XLSX.utils.json_to_sheet(clientsData);
    XLSX.utils.book_append_sheet(wb, wsClients, 'Clients');

    // 4. Time Log Sheet
    const timeData = state.timeLogs.map((t) => ({
      Date: t.date,
      Person: t.person,
      Client: t.client,
      Lane: t.lane,
      Hours: t.hours,
      Task: t.task,
      Note: t.note || '',
    }));
    const wsTime = XLSX.utils.json_to_sheet(timeData);
    XLSX.utils.book_append_sheet(wb, wsTime, 'Time Log');

    // 5. Team Tasks Sheet
    const tasksData = state.teamTasks.map((t) => ({
      ID: t.id,
      Task: t.task,
      Lane: t.lane,
      Owner: t.owner,
      Created: t.created,
      Deadline: t.deadline,
      Status: t.status,
      'Reviewed by Me': t.reviewedByMe ? 'Yes' : 'No',
      Flag: t.flag,
      Notes: t.notes || '',
    }));
    const wsTasks = XLSX.utils.json_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Team Tasks');

    // 6. Invoices Sheet
    const invoicesData = state.invoices.map((i) => ({
      'Invoice #': i.invoiceNumber,
      'Issue Date': i.issueDate,
      Client: i.client,
      'Amount ($)': i.amount,
      Status: i.status,
      'Due Date': i.dueDate,
      'Paid Date': i.paidDate || '',
      Note: i.note || '',
    }));
    const wsInvoices = XLSX.utils.json_to_sheet(invoicesData);
    XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices');

    // 7. Expenses Sheet
    const expensesData = state.expenses.map((e) => ({
      Date: e.date,
      Category: e.category,
      Vendor: e.vendor,
      'Amount ($)': e.amount,
      'Recurring?': e.isRecurring ? 'Yes' : 'No',
      Note: e.note || '',
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="hvac_leadgen_export.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
