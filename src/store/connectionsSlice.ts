
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Connection {
  id: string;
  participants: string[];
  status: 'active' | 'blocked' | 'pending';
  createdAt: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    photoURL: string;
    thumbnailURL: string;
  };
}

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  fromUser: {
    id: string;
    firstName: string;
    lastName: string;
    photoURL: string;
    thumbnailURL: string;
  };
}

interface ConnectionsState {
  connections: Connection[];
  connectionRequests: ConnectionRequest[];
  loading: boolean;
  error: string | null;
  lastConnectionsFetch: number;
  lastRequestsFetch: number;
}

const initialState: ConnectionsState = {
  connections: [],
  connectionRequests: [],
  loading: false,
  error: null,
  lastConnectionsFetch: 0,
  lastRequestsFetch: 0,
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    setConnections: (state, action: PayloadAction<Connection[]>) => {
      state.connections = action.payload;
      state.lastConnectionsFetch = Date.now();
    },
    setConnectionRequests: (state, action: PayloadAction<ConnectionRequest[]>) => {
      state.connectionRequests = action.payload;
      state.lastRequestsFetch = Date.now();
    },
    addConnection: (state, action: PayloadAction<Connection>) => {
      state.connections.push(action.payload);
    },
    removeConnection: (state, action: PayloadAction<string>) => {
      state.connections = state.connections.filter(conn => conn.id !== action.payload);
    },
    addConnectionRequest: (state, action: PayloadAction<ConnectionRequest>) => {
      state.connectionRequests.push(action.payload);
    },
    removeConnectionRequest: (state, action: PayloadAction<string>) => {
      state.connectionRequests = state.connectionRequests.filter(req => req.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearConnectionsData: (state) => {
      state.connections = [];
      state.connectionRequests = [];
      state.loading = false;
      state.error = null;
      state.lastConnectionsFetch = 0;
      state.lastRequestsFetch = 0;
    },
    logout: (state) => {
      // Clear all connections data on logout
      state.connections = [];
      state.connectionRequests = [];
      state.loading = false;
      state.error = null;
      state.lastConnectionsFetch = 0;
      state.lastRequestsFetch = 0;
    },
  },
});

export const {
  setConnections,
  setConnectionRequests,
  addConnection,
  removeConnection,
  addConnectionRequest,
  removeConnectionRequest,
  setLoading,
  setError,
  clearConnectionsData,
  logout,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;
