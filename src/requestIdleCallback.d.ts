type RequestIdleCallbackHandle = any;

type RequestIdleCallbackOptions = {
  timeout: number;
};

type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: (() => number);
};

declare var requestIdleCallback: ((
  callback: ((deadline: RequestIdleCallbackDeadline) => void),
  opts?: RequestIdleCallbackOptions,
) => RequestIdleCallbackHandle);

declare var cancelIdleCallback: ((handle: RequestIdleCallbackHandle) => void);
