export type PluginErrorCode =
  | 'ACTIVATION_FAILED'
  | 'ALREADY_INSTALLED'
  | 'CONTRIBUTION_CONFLICT'
  | 'INVALID_MANIFEST'
  | 'NOT_INSTALLED'
  | 'PERMISSION_DENIED'
  | 'RPC_CLOSED'
  | 'RPC_TIMEOUT';

export class PluginError extends Error {
  readonly code: PluginErrorCode;

  constructor(code: PluginErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
    this.name = 'PluginError';
  }
}
