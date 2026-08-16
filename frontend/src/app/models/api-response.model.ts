export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: ApiMeta;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  message: string;
  details?: ApiFieldError[];
}
