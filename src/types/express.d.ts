import "express";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        uid: string;
        email?: string;
        name?: string;
      };
    }
  }
}

export {};
