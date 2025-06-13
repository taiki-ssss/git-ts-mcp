export interface GitOperationResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export interface GitErrorResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export function createSuccessResult(text: string): GitOperationResult {
  return {
    content: [
      {
        type: 'text' as const,
        text,
      },
    ],
  };
}

export function createErrorResult(error: Error | string): GitErrorResult {
  const errorMessage = error instanceof Error ? error.message : error;
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error: ${errorMessage}`,
      },
    ],
  };
}

export function formatResultMatch<T>(
  result: { match: (onSuccess: (value: T) => any, onError: (error: Error) => any) => any }
): any {
  return result.match(
    (value: T) => value,
    (error: Error) => createErrorResult(error)
  );
}
