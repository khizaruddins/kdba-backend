import { HttpException, HttpStatus } from '@nestjs/common';

export const DocumentErrorCode = {
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  INVALID_NODE: 'INVALID_NODE',
  INVALID_PARENT: 'INVALID_PARENT',
  INVALID_OPERATION: 'INVALID_OPERATION',
  DOCUMENT_REVISION_CONFLICT: 'DOCUMENT_REVISION_CONFLICT',
  DOCUMENT_VALIDATION_FAILED: 'DOCUMENT_VALIDATION_FAILED',
  DOCUMENT_TOO_LARGE: 'DOCUMENT_TOO_LARGE',
  PUBLISH_FAILED: 'PUBLISH_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type DocumentErrorCode =
  (typeof DocumentErrorCode)[keyof typeof DocumentErrorCode];

export class DocumentException extends HttpException {
  constructor(
    code: DocumentErrorCode,
    message: string,
    status: HttpStatus,
    extras: Record<string, unknown> = {},
  ) {
    super({ code, message, ...extras }, status);
  }
}

export function documentValidationFailed(
  message: string,
  errors: Array<{ path: string; message: string }>,
): DocumentException {
  return new DocumentException(
    DocumentErrorCode.DOCUMENT_VALIDATION_FAILED,
    message,
    HttpStatus.BAD_REQUEST,
    { errors },
  );
}

export function documentRevisionConflict(
  currentRevision: number,
  expectedRevision: number,
): DocumentException {
  return new DocumentException(
    DocumentErrorCode.DOCUMENT_REVISION_CONFLICT,
    'Document revision conflict: the draft has changed since this session last loaded it',
    HttpStatus.CONFLICT,
    { currentRevision, expectedRevision },
  );
}

export function publishFailed(message: string): DocumentException {
  return new DocumentException(
    DocumentErrorCode.PUBLISH_FAILED,
    message,
    HttpStatus.BAD_REQUEST,
  );
}
