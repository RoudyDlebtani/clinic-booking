// Adds the authenticated user id that requireAuth attaches to the request, and
// the linked doctor id that requireDoctor attaches for doctor-only routes.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      doctorId?: string;
    }
  }
}

export {};
