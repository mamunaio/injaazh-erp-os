process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-chars-long-secure-random';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test_dummy_isolated_db';
(process.env as any).NODE_ENV = 'test';

// Mock mongoose connection cache to prevent live database connections
const mockMongooseConn = { readyState: 1 };
(global as any).mongoose = {
  conn: mockMongooseConn,
  promise: Promise.resolve(mockMongooseConn),
};

import Session from '../../models/Session';
import User from '../../models/User';
import { PersonalDebt } from '../../models/PersonalDebt';
import { LeadGenClientModel, LeadGenProspectModel, LeadGenDailyLogModel } from '../../models/leadGen';

export const mockSessionStore: Record<string, { sessionId: string; isValid: boolean; userId?: string }> = {
  'session_mock_valid_123': { sessionId: 'session_mock_valid_123', isValid: true, userId: 'user_mock_001' },
  'session_mock_valid_admin': { sessionId: 'session_mock_valid_admin', isValid: true, userId: 'user_admin_001' },
  'session_mock_valid_owner': { sessionId: 'session_mock_valid_owner', isValid: true, userId: 'user_owner_001' },
  'session_mock_revoked_456': { sessionId: 'session_mock_revoked_456', isValid: false, userId: 'user_mock_002' },
};

export const mockUserStore: Record<string, any> = {
  'u_v': { _id: 'u_v', email: 'v@i.com', role: 'viewer', tokenVersion: 0 },
  'u_e': { _id: 'u_e', email: 'e@i.com', role: 'editor', tokenVersion: 0 },
  'u_a': { _id: 'u_a', email: 'a@i.com', role: 'admin', tokenVersion: 0 },
  'u_o': { _id: 'u_o', email: 'o@i.com', role: 'owner', tokenVersion: 0 },
  'user_mock_001': { _id: 'user_mock_001', email: 'user@mock.com', role: 'editor', tokenVersion: 0 },
  'user_admin_001': { _id: 'user_admin_001', email: 'admin@mock.com', role: 'admin', tokenVersion: 0 },
  'user_owner_001': { _id: 'user_owner_001', email: 'owner@mock.com', role: 'owner', tokenVersion: 0 },
};

export const dbMutationCalls: Array<{ method: string; args: any[] }> = [];

Session.findOne = ((query: any) => {
  const sess = query?.sessionId ? mockSessionStore[query.sessionId] : null;
  return {
    exec: async () => sess || null,
    then: (resolve: any, reject: any) => Promise.resolve(sess || null).then(resolve, reject),
  };
}) as any;

Session.updateOne = (async (filter: any, update: any) => {
  dbMutationCalls.push({ method: 'Session.updateOne', args: [filter, update] });
  if (filter?.sessionId && mockSessionStore[filter.sessionId]) {
    if (update?.$set?.isValid !== undefined) {
      mockSessionStore[filter.sessionId].isValid = update.$set.isValid;
    }
  }
  return { acknowledged: true, modifiedCount: 1 };
}) as any;

Session.updateMany = (async (filter: any, update: any) => {
  dbMutationCalls.push({ method: 'Session.updateMany', args: [filter, update] });
  if (filter?.userId) {
    Object.keys(mockSessionStore).forEach(sId => {
      if (mockSessionStore[sId].userId === filter.userId.toString()) {
        mockSessionStore[sId].isValid = false;
      }
    });
  }
  return { acknowledged: true, modifiedCount: 1 };
}) as any;

Session.create = (async (doc: any) => {
  dbMutationCalls.push({ method: 'Session.create', args: [doc] });
  if (doc?.sessionId) {
    mockSessionStore[doc.sessionId] = {
      sessionId: doc.sessionId,
      isValid: doc.isValid ?? true,
      userId: doc.userId?.toString(),
    };
  }
  return doc;
}) as any;

User.findOne = ((query: any) => {
  let user: any = null;
  if (query?.email && mockUserStore[query.email]) {
    user = mockUserStore[query.email];
  } else if (query?.resetPasswordToken) {
    const foundKey = Object.keys(mockUserStore).find(
      k => mockUserStore[k].resetPasswordToken === query.resetPasswordToken
    );
    if (foundKey) {
      const candidate = mockUserStore[foundKey];
      if (query.resetPasswordExpires?.$gt) {
        if (candidate.resetPasswordExpires && candidate.resetPasswordExpires.getTime() > query.resetPasswordExpires.$gt) {
          user = candidate;
        }
      } else {
        user = candidate;
      }
    }
  }

  const queryObj = {
    select: () => queryObj,
    exec: async () => user,
    then: (resolve: any, reject: any) => Promise.resolve(user).then(resolve, reject),
  };
  return queryObj;
}) as any;

User.findById = ((id: any) => {
  const idStr = id?.toString();
  const foundKey = Object.keys(mockUserStore).find(
    k => mockUserStore[k]._id === idStr || mockUserStore[k].id === idStr
  );
  let user = foundKey ? mockUserStore[foundKey] : null;

  if (!user && idStr) {
    user = {
      _id: idStr,
      email: `${idStr}@test.com`,
      role: 'editor',
      tokenVersion: 0,
    };
    mockUserStore[idStr] = user;
  }

  const queryObj = {
    select: () => queryObj,
    exec: async () => user,
    then: (resolve: any, reject: any) => Promise.resolve(user).then(resolve, reject),
  };
  return queryObj;
}) as any;

User.findOneAndUpdate = (async (query: any, update: any, options: any) => {
  dbMutationCalls.push({ method: 'User.findOneAndUpdate', args: [query, update, options] });

  let matchedUserKey: string | null = null;
  if (query?.resetPasswordToken) {
    const foundKey = Object.keys(mockUserStore).find(
      k => mockUserStore[k].resetPasswordToken === query.resetPasswordToken
    );
    if (foundKey) {
      const candidate = mockUserStore[foundKey];
      if (query.resetPasswordExpires?.$gt) {
        const queryDate = query.resetPasswordExpires.$gt instanceof Date
          ? query.resetPasswordExpires.$gt.getTime()
          : query.resetPasswordExpires.$gt;
        if (candidate.resetPasswordExpires && candidate.resetPasswordExpires.getTime() > queryDate) {
          matchedUserKey = foundKey;
        }
      } else {
        matchedUserKey = foundKey;
      }
    }
  } else if (query?.email && mockUserStore[query.email]) {
    matchedUserKey = query.email;
  } else if (query?._id) {
    const foundKey = Object.keys(mockUserStore).find(
      k => mockUserStore[k]._id === query._id
    );
    if (foundKey) matchedUserKey = foundKey;
  }

  if (!matchedUserKey) {
    return null;
  }

  const user = mockUserStore[matchedUserKey];

  if (update?.$set) {
    Object.assign(user, update.$set);
  }
  if (update?.$unset) {
    for (const key of Object.keys(update.$unset)) {
      delete user[key];
    }
  }
  if (update?.$inc) {
    for (const key of Object.keys(update.$inc)) {
      const currentVal = typeof user[key] === 'number' ? user[key] : 0;
      user[key] = currentVal + update.$inc[key];
    }
  }

  return user;
}) as any;

PersonalDebt.find = ((query?: any) => {
  dbMutationCalls.push({ method: 'PersonalDebt.find', args: [query] });
  return {
    exec: async () => [],
    then: (resolve: any, reject: any) => Promise.resolve([]).then(resolve, reject),
  };
}) as any;

PersonalDebt.findByIdAndUpdate = ((id: any, update: any) => {
  dbMutationCalls.push({ method: 'PersonalDebt.findByIdAndUpdate', args: [id, update] });
  return {
    exec: async () => ({ _id: id, ...update }),
    then: (resolve: any, reject: any) => Promise.resolve({ _id: id, ...update }).then(resolve, reject),
  };
}) as any;

LeadGenClientModel.find = ((query?: any) => {
  dbMutationCalls.push({ method: 'LeadGenClientModel.find', args: [query] });
  return {
    exec: async () => [],
    lean: () => ({
      exec: async () => [],
      then: (resolve: any, reject: any) => Promise.resolve([]).then(resolve, reject),
    }),
    then: (resolve: any, reject: any) => Promise.resolve([]).then(resolve, reject),
  };
}) as any;

LeadGenProspectModel.find = ((query?: any) => {
  dbMutationCalls.push({ method: 'LeadGenProspectModel.find', args: [query] });
  return {
    exec: async () => [],
    lean: () => ({
      exec: async () => [],
      then: (resolve: any, reject: any) => Promise.resolve([]).then(resolve, reject),
    }),
    then: (resolve: any, reject: any) => Promise.resolve([]).then(resolve, reject),
  };
}) as any;

LeadGenDailyLogModel.find = ((query?: any) => {
  dbMutationCalls.push({ method: 'LeadGenDailyLogModel.find', args: [query] });
  return {
    exec: async () => [],
    lean: () => ({
      exec: async () => [],
      then: (resolve: any, reject: any) => Promise.resolve([]).then(resolve, reject),
    }),
    then: (resolve: any, reject: any) => Promise.resolve([]).then(resolve, reject),
  };
}) as any;
