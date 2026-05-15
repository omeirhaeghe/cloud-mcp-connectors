export type McpErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'upstream_error'
  | 'invalid_input'
  | 'internal';

export class McpError extends Error {
  override readonly name = 'McpError';
  constructor(
    public readonly code: McpErrorCode,
    message: string,
    public readonly status = mapStatus(code),
    public override readonly cause?: unknown,
  ) {
    super(message);
  }
}

function mapStatus(code: McpErrorCode): number {
  switch (code) {
    case 'unauthorized':
      return 401;
    case 'forbidden':
      return 403;
    case 'not_found':
      return 404;
    case 'rate_limited':
      return 429;
    case 'invalid_input':
      return 400;
    case 'upstream_error':
      return 502;
    case 'internal':
      return 500;
  }
}
