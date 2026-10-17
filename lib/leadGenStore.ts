import fs from 'fs';
import path from 'path';
import connectToDatabase from '@/lib/mongodb';
import {
  LeadGenProspectModel,
  LeadGenDailyLogModel,
  LeadGenClientModel,
  LeadGenTimeLogModel,
  LeadGenTeamTaskModel,
  LeadGenDeliveryItemModel,
  LeadGenInvoiceModel,
  LeadGenExpenseModel,
  LeadGenSettingsModel,
} from '@/models/leadGen';
import {
  DatabaseState,
  Prospect,
  DailyLog,
  Client,
  TimeLog,
  TeamTask,
  DeliveryItem,
  Invoice,
  Expense,
  SystemSettings,
} from '@/types/leadGen';
import initialData from '@/data/leadGenInitialData.json';

const DATA_FILE = path.join(process.cwd(), 'data', 'leadGenDb.json');

function ensureLocalFile(): DatabaseState {
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = JSON.parse(JSON.stringify(initialData)) as DatabaseState;
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseState;
  } catch (err) {
    console.error('Error reading local leadGenDb.json:', err);
    return JSON.parse(JSON.stringify(initialData)) as DatabaseState;
  }
}

function saveLocalFile(state: DatabaseState): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local leadGenDb.json:', err);
  }
}

export async function getLeadGenFullState(): Promise<DatabaseState> {
  try {
    await connectToDatabase();
    const [
      prospects,
      dailyLogs,
      clients,
      timeLogs,
      teamTasks,
      deliveryCalendar,
      invoices,
      expenses,
      settingsDoc,
    ] = await Promise.all([
      LeadGenProspectModel.find().lean(),
      LeadGenDailyLogModel.find().lean(),
      LeadGenClientModel.find().lean(),
      LeadGenTimeLogModel.find().lean(),
      LeadGenTeamTaskModel.find().lean(),
      LeadGenDeliveryItemModel.find().lean(),
      LeadGenInvoiceModel.find().lean(),
      LeadGenExpenseModel.find().lean(),
      LeadGenSettingsModel.findOne().lean(),
    ]);

    // If MongoDB has no data yet, seed it from initial data
    if (prospects.length === 0 && clients.length === 0) {
      const defState = ensureLocalFile();
      await Promise.all([
        LeadGenProspectModel.insertMany(defState.prospects),
        LeadGenDailyLogModel.insertMany(defState.dailyLogs),
        LeadGenClientModel.insertMany(defState.clients),
        LeadGenTimeLogModel.insertMany(defState.timeLogs),
        LeadGenTeamTaskModel.insertMany(defState.teamTasks),
        LeadGenDeliveryItemModel.insertMany(defState.deliveryCalendar),
        LeadGenInvoiceModel.insertMany(defState.invoices),
        LeadGenExpenseModel.insertMany(defState.expenses),
        LeadGenSettingsModel.create(defState.settings),
      ]);
      return {
        ...defState,
        settings: {
          ...defState.settings,
          mongoConnected: true,
        },
      };
    }

    const settings: SystemSettings = settingsDoc
      ? (settingsDoc as unknown as SystemSettings)
      : (initialData.settings as SystemSettings);

    return {
      settings: {
        ...settings,
        mongoConnected: true,
      },
      prospects: (prospects as unknown as Prospect[]) || [],
      dailyLogs: (dailyLogs as unknown as DailyLog[]) || [],
      clients: (clients as unknown as Client[]) || [],
      timeLogs: (timeLogs as unknown as TimeLog[]) || [],
      teamTasks: (teamTasks as unknown as TeamTask[]) || [],
      deliveryCalendar: (deliveryCalendar as unknown as DeliveryItem[]) || [],
      invoices: (invoices as unknown as Invoice[]) || [],
      expenses: (expenses as unknown as Expense[]) || [],
    };
  } catch (err) {
    console.warn('MongoDB query failed for LeadGen, falling back to local leadGenDb.json:', err);
    const local = ensureLocalFile();
    return {
      ...local,
      settings: {
        ...local.settings,
        mongoConnected: false,
      },
    };
  }
}

export async function saveLeadGenFullState(state: DatabaseState): Promise<void> {
  try {
    await connectToDatabase();
    await Promise.all([
      LeadGenProspectModel.deleteMany({}),
      LeadGenDailyLogModel.deleteMany({}),
      LeadGenClientModel.deleteMany({}),
      LeadGenTimeLogModel.deleteMany({}),
      LeadGenTeamTaskModel.deleteMany({}),
      LeadGenDeliveryItemModel.deleteMany({}),
      LeadGenInvoiceModel.deleteMany({}),
      LeadGenExpenseModel.deleteMany({}),
      LeadGenSettingsModel.deleteMany({}),
    ]);

    await Promise.all([
      LeadGenProspectModel.insertMany(state.prospects),
      LeadGenDailyLogModel.insertMany(state.dailyLogs),
      LeadGenClientModel.insertMany(state.clients),
      LeadGenTimeLogModel.insertMany(state.timeLogs),
      LeadGenTeamTaskModel.insertMany(state.teamTasks),
      LeadGenDeliveryItemModel.insertMany(state.deliveryCalendar),
      LeadGenInvoiceModel.insertMany(state.invoices),
      LeadGenExpenseModel.insertMany(state.expenses),
      LeadGenSettingsModel.create(state.settings),
    ]);
  } catch (err) {
    console.warn('MongoDB save failed for LeadGen, writing to local file:', err);
  }
  saveLocalFile(state);
}

// ================= PROSPECTS =================
export async function getProspects(): Promise<Prospect[]> {
  const state = await getLeadGenFullState();
  return state.prospects;
}

export async function createProspect(data: Omit<Prospect, 'id'> & { id?: string }): Promise<Prospect> {
  const newId = data.id || `P${String(Date.now()).slice(-4)}`;
  const prospect: Prospect = { ...data, id: newId };

  try {
    await connectToDatabase();
    const created = await LeadGenProspectModel.create(prospect);
    return created.toObject() as unknown as Prospect;
  } catch (err) {
    console.warn('MongoDB createProspect fallback to local:', err);
  }

  const local = ensureLocalFile();
  local.prospects.unshift(prospect);
  saveLocalFile(local);
  return prospect;
}

export async function updateProspect(id: string, data: Partial<Prospect>): Promise<Prospect | null> {
  try {
    await connectToDatabase();
    const updated = await LeadGenProspectModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();
    if (updated) return updated as unknown as Prospect;
  } catch (err) {
    console.warn('MongoDB updateProspect fallback to local:', err);
  }

  const local = ensureLocalFile();
  const index = local.prospects.findIndex((p) => p.id === id);
  if (index !== -1) {
    local.prospects[index] = { ...local.prospects[index], ...data };
    saveLocalFile(local);
    return local.prospects[index];
  }
  return null;
}

export async function deleteProspect(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const res = await LeadGenProspectModel.deleteOne({ id });
    if (res.deletedCount > 0) return true;
  } catch (err) {
    console.warn('MongoDB deleteProspect fallback to local:', err);
  }

  const local = ensureLocalFile();
  const initialLen = local.prospects.length;
  local.prospects = local.prospects.filter((p) => p.id !== id);
  if (local.prospects.length !== initialLen) {
    saveLocalFile(local);
    return true;
  }
  return false;
}

// ================= DAILY LOGS =================
export async function getDailyLogs(): Promise<DailyLog[]> {
  const state = await getLeadGenFullState();
  return state.dailyLogs;
}

export async function createDailyLog(data: Omit<DailyLog, 'id'> & { id?: string }): Promise<DailyLog> {
  const newId = data.id || `DL${String(Date.now()).slice(-4)}`;
  const log: DailyLog = { ...data, id: newId };

  try {
    await connectToDatabase();
    const created = await LeadGenDailyLogModel.create(log);
    return created.toObject() as unknown as DailyLog;
  } catch (err) {
    console.warn('MongoDB createDailyLog fallback to local:', err);
  }

  const local = ensureLocalFile();
  local.dailyLogs.unshift(log);
  saveLocalFile(local);
  return log;
}

// ================= CLIENTS =================
export async function getClients(): Promise<Client[]> {
  const state = await getLeadGenFullState();
  return state.clients;
}

export async function createClient(data: Omit<Client, 'id'> & { id?: string }): Promise<Client> {
  const newId = data.id || `C${String(Date.now()).slice(-4)}`;
  const client: Client = { ...data, id: newId };

  try {
    await connectToDatabase();
    const created = await LeadGenClientModel.create(client);
    return created.toObject() as unknown as Client;
  } catch (err) {
    console.warn('MongoDB createClient fallback to local:', err);
  }

  const local = ensureLocalFile();
  local.clients.push(client);
  saveLocalFile(local);
  return client;
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client | null> {
  try {
    await connectToDatabase();
    const updated = await LeadGenClientModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();
    if (updated) return updated as unknown as Client;
  } catch (err) {
    console.warn('MongoDB updateClient fallback to local:', err);
  }

  const local = ensureLocalFile();
  const index = local.clients.findIndex((c) => c.id === id);
  if (index !== -1) {
    local.clients[index] = { ...local.clients[index], ...data };
    saveLocalFile(local);
    return local.clients[index];
  }
  return null;
}

export async function deleteClient(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const res = await LeadGenClientModel.deleteOne({ id });
    if (res.deletedCount > 0) return true;
  } catch (err) {
    console.warn('MongoDB deleteClient fallback to local:', err);
  }

  const local = ensureLocalFile();
  const initialLen = local.clients.length;
  local.clients = local.clients.filter((c) => c.id !== id);
  if (local.clients.length !== initialLen) {
    saveLocalFile(local);
    return true;
  }
  return false;
}

// ================= TIME LOGS =================
export async function getTimeLogs(): Promise<TimeLog[]> {
  const state = await getLeadGenFullState();
  return state.timeLogs;
}

export async function createTimeLog(data: Omit<TimeLog, 'id'> & { id?: string }): Promise<TimeLog> {
  const newId = data.id || `TL${String(Date.now()).slice(-4)}`;
  const timeLog: TimeLog = { ...data, id: newId };

  try {
    await connectToDatabase();
    const created = await LeadGenTimeLogModel.create(timeLog);
    return created.toObject() as unknown as TimeLog;
  } catch (err) {
    console.warn('MongoDB createTimeLog fallback to local:', err);
  }

  const local = ensureLocalFile();
  local.timeLogs.unshift(timeLog);
  saveLocalFile(local);
  return timeLog;
}

// ================= TEAM TASKS =================
export async function getTeamTasks(): Promise<TeamTask[]> {
  const state = await getLeadGenFullState();
  return state.teamTasks;
}

export async function createTeamTask(data: Omit<TeamTask, 'id'> & { id?: string }): Promise<TeamTask> {
  const newId = data.id || `T${String(Date.now()).slice(-4)}`;
  const task: TeamTask = { ...data, id: newId };

  try {
    await connectToDatabase();
    const created = await LeadGenTeamTaskModel.create(task);
    return created.toObject() as unknown as TeamTask;
  } catch (err) {
    console.warn('MongoDB createTeamTask fallback to local:', err);
  }

  const local = ensureLocalFile();
  local.teamTasks.unshift(task);
  saveLocalFile(local);
  return task;
}

export async function updateTeamTask(id: string, data: Partial<TeamTask>): Promise<TeamTask | null> {
  try {
    await connectToDatabase();
    const updated = await LeadGenTeamTaskModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();
    if (updated) return updated as unknown as TeamTask;
  } catch (err) {
    console.warn('MongoDB updateTeamTask fallback to local:', err);
  }

  const local = ensureLocalFile();
  const index = local.teamTasks.findIndex((t) => t.id === id);
  if (index !== -1) {
    local.teamTasks[index] = { ...local.teamTasks[index], ...data };
    saveLocalFile(local);
    return local.teamTasks[index];
  }
  return null;
}

export async function deleteTeamTask(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const res = await LeadGenTeamTaskModel.deleteOne({ id });
    if (res.deletedCount > 0) return true;
  } catch (err) {
    console.warn('MongoDB deleteTeamTask fallback to local:', err);
  }

  const local = ensureLocalFile();
  const initialLen = local.teamTasks.length;
  local.teamTasks = local.teamTasks.filter((t) => t.id !== id);
  if (local.teamTasks.length !== initialLen) {
    saveLocalFile(local);
    return true;
  }
  return false;
}

// ================= DELIVERY CALENDAR =================
export async function getDeliveryCalendar(): Promise<DeliveryItem[]> {
  const state = await getLeadGenFullState();
  return state.deliveryCalendar;
}

export async function createDeliveryItem(data: Omit<DeliveryItem, 'id'> & { id?: string }): Promise<DeliveryItem> {
  const newId = data.id || `DC${String(Date.now()).slice(-4)}`;
  const item: DeliveryItem = { ...data, id: newId };

  try {
    await connectToDatabase();
    const created = await LeadGenDeliveryItemModel.create(item);
    return created.toObject() as unknown as DeliveryItem;
  } catch (err) {
    console.warn('MongoDB createDeliveryItem fallback to local:', err);
  }

  const local = ensureLocalFile();
  local.deliveryCalendar.unshift(item);
  saveLocalFile(local);
  return item;
}

export async function updateDeliveryItem(id: string, data: Partial<DeliveryItem>): Promise<DeliveryItem | null> {
  try {
    await connectToDatabase();
    const updated = await LeadGenDeliveryItemModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();
    if (updated) return updated as unknown as DeliveryItem;
  } catch (err) {
    console.warn('MongoDB updateDeliveryItem fallback to local:', err);
  }

  const local = ensureLocalFile();
  const index = local.deliveryCalendar.findIndex((d) => d.id === id);
  if (index !== -1) {
    local.deliveryCalendar[index] = { ...local.deliveryCalendar[index], ...data };
    saveLocalFile(local);
    return local.deliveryCalendar[index];
  }
  return null;
}

// ================= INVOICES =================
export async function getInvoices(): Promise<Invoice[]> {
  const state = await getLeadGenFullState();
  return state.invoices;
}

export async function createInvoice(data: Omit<Invoice, 'id'> & { id?: string }): Promise<Invoice> {
  const newId = data.id || `INV-${String(Date.now()).slice(-4)}`;
  const invoice: Invoice = { ...data, id: newId };

  try {
    await connectToDatabase();
    const created = await LeadGenInvoiceModel.create(invoice);
    return created.toObject() as unknown as Invoice;
  } catch (err) {
    console.warn('MongoDB createInvoice fallback to local:', err);
  }

  const local = ensureLocalFile();
  local.invoices.unshift(invoice);
  saveLocalFile(local);
  return invoice;
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
  try {
    await connectToDatabase();
    const updated = await LeadGenInvoiceModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();
    if (updated) return updated as unknown as Invoice;
  } catch (err) {
    console.warn('MongoDB updateInvoice fallback to local:', err);
  }

  const local = ensureLocalFile();
  const index = local.invoices.findIndex((inv) => inv.id === id);
  if (index !== -1) {
    local.invoices[index] = { ...local.invoices[index], ...data };
    saveLocalFile(local);
    return local.invoices[index];
  }
  return null;
}

// ================= EXPENSES =================
export async function getExpenses(): Promise<Expense[]> {
  const state = await getLeadGenFullState();
  return state.expenses;
}

export async function createExpense(data: Omit<Expense, 'id'> & { id?: string }): Promise<Expense> {
  const newId = data.id || `EXP${String(Date.now()).slice(-4)}`;
  const expense: Expense = { ...data, id: newId };

  try {
    await connectToDatabase();
    const created = await LeadGenExpenseModel.create(expense);
    return created.toObject() as unknown as Expense;
  } catch (err) {
    console.warn('MongoDB createExpense fallback to local:', err);
  }

  const local = ensureLocalFile();
  local.expenses.unshift(expense);
  saveLocalFile(local);
  return expense;
}

// ================= SETTINGS =================
export async function getSettings(): Promise<SystemSettings> {
  const state = await getLeadGenFullState();
  return state.settings;
}

export async function updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
  try {
    await connectToDatabase();
    const updated = await LeadGenSettingsModel.findOneAndUpdate({}, { $set: data }, { new: true, upsert: true }).lean();
    if (updated) return updated as unknown as SystemSettings;
  } catch (err) {
    console.warn('MongoDB updateSettings fallback to local:', err);
  }

  const local = ensureLocalFile();
  local.settings = { ...local.settings, ...data };
  saveLocalFile(local);
  return local.settings;
}

// ================= SEED & RESET =================
export async function seedDatabase(forceMongoSync = true): Promise<{ success: boolean; message: string }> {
  const defaultData = JSON.parse(JSON.stringify(initialData)) as DatabaseState;
  saveLocalFile(defaultData);

  if (forceMongoSync) {
    try {
      await connectToDatabase();
      await Promise.all([
        LeadGenProspectModel.deleteMany({}),
        LeadGenDailyLogModel.deleteMany({}),
        LeadGenClientModel.deleteMany({}),
        LeadGenTimeLogModel.deleteMany({}),
        LeadGenTeamTaskModel.deleteMany({}),
        LeadGenDeliveryItemModel.deleteMany({}),
        LeadGenInvoiceModel.deleteMany({}),
        LeadGenExpenseModel.deleteMany({}),
        LeadGenSettingsModel.deleteMany({}),
      ]);

      await Promise.all([
        LeadGenProspectModel.insertMany(defaultData.prospects),
        LeadGenDailyLogModel.insertMany(defaultData.dailyLogs),
        LeadGenClientModel.insertMany(defaultData.clients),
        LeadGenTimeLogModel.insertMany(defaultData.timeLogs),
        LeadGenTeamTaskModel.insertMany(defaultData.teamTasks),
        LeadGenDeliveryItemModel.insertMany(defaultData.deliveryCalendar),
        LeadGenInvoiceModel.insertMany(defaultData.invoices),
        LeadGenExpenseModel.insertMany(defaultData.expenses),
        LeadGenSettingsModel.create(defaultData.settings),
      ]);

      return { success: true, message: 'Seeded both MongoDB and local database successfully!' };
    } catch (err) {
      return { success: true, message: `Seeded locally, but MongoDB error: ${(err as Error).message}` };
    }
  }

  return { success: true, message: 'Local database seeded and synced with template!' };
}
