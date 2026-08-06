import { Request, Response, NextFunction } from 'express';

export interface ServerTimingResponse extends Response {
  startTime: (key: string, desc: string) => void;
  endTime: (key: string) => void;
}

export const serverTimingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const timings: { key: string; desc: string; start: number; duration?: number }[] = [];

  const timedRes = res as ServerTimingResponse;

  timedRes.startTime = (key: string, desc: string) => {
    timings.push({ key, desc, start: performance.now() });
  };

  timedRes.endTime = (key: string) => {
    const timing = timings.find((t) => t.key === key);
    if (timing) {
      timing.duration = performance.now() - timing.start;
    }
  };

  // Measure total request duration automatically
  const startTotal = performance.now();

  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any, callback?: any) {
    if (!res.headersSent) {
      // Record final total duration
      const totalDur = performance.now() - startTotal;
      timings.push({ key: 'total', desc: 'Total Request Duration', start: startTotal, duration: totalDur });

      const headerValue = timings
        .filter((t) => t.duration !== undefined)
        .map((t) => `${t.key};desc="${t.desc}";dur=${t.duration!.toFixed(2)}`)
        .join(', ');
      
      if (headerValue) {
        res.setHeader('Server-Timing', headerValue);
      }
    }
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};
