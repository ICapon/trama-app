export interface SessionData {
  userId?: string;
  isLoggedIn: boolean;
}

export interface SessionContextValue {
  session: SessionData;
  setSession: (data: SessionData) => void;
}
