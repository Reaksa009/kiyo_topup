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

  const injectHeader = () => {
    if (res.headersSent) return;
    const totalDur = performance.now() - startTotal;
    if (!timings.some((t) => t.key === 'total')) {
      timings.push({ key: 'total', desc: 'Total Request Duration', start: startTotal, duration: totalDur });
    }

    const headerValue = timings
      .filter((t) => t.duration !== undefined)
      .map((t) => `${t.key};desc="${t.desc}";dur=${t.duration!.toFixed(2)}`)
      .join(', ');
    
    if (headerValue) {
      res.setHeader('Server-Timing', headerValue);
      console.log(`[Server-Timing] Injected header: ${headerValue} for path: ${req.originalUrl || req.url}`);
    }
  };

  const originalWriteHead = res.writeHead;
  res.writeHead = function (statusCode: any, ...args: any[]) {
    injectHeader();
    return (originalWriteHead as any).apply(this, [statusCode, ...args]);
  };

  const originalSend = res.send;
  res.send = function (body: any) {
    injectHeader();
    return originalSend.call(this, body);
  };

  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any, callback?: any) {
    injectHeader();
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};
