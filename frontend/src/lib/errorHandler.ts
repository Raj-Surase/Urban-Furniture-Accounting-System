import axios, { AxiosError } from 'axios';

export interface FormattedError {
  message: string;
  fieldErrors: Record<string, string>;
  status?: number;
  isNetworkError: boolean;
  isValidationError: boolean;
}

/**
 * Extracts human-readable and field-level errors from Laravel API responses or Axios exceptions.
 */
export function formatApiError(error: unknown): FormattedError {
  const result: FormattedError = {
    message: 'An unexpected error occurred. Please try again.',
    fieldErrors: {},
    isNetworkError: false,
    isValidationError: false,
  };

  if (!error) return result;

  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<any>;

    if (axiosErr.response) {
      result.status = axiosErr.response.status;
      const data = axiosErr.response.data;

      // Extract field-level errors if present (Laravel errors dictionary)
      if (data?.errors && typeof data.errors === 'object') {
        result.isValidationError = true;
        const messages: string[] = [];

        for (const [key, value] of Object.entries(data.errors)) {
          if (Array.isArray(value) && value.length > 0) {
            const firstMsg = String(value[0]);
            result.fieldErrors[key] = firstMsg;
            messages.push(...value.map(String));
          } else if (typeof value === 'string') {
            result.fieldErrors[key] = value;
            messages.push(value);
          }
        }

        if (messages.length > 0) {
          // If Laravel provided a generic summary message or no message, show specific field errors
          if (!data?.message || data.message === 'The given data was invalid.' || data.message.includes('and ') && data.message.includes('more error')) {
            result.message = messages.join(' ');
          } else {
            result.message = data.message;
          }
        } else if (data?.message) {
          result.message = data.message;
        }

        return result;
      }

      // Handle Laravel Validation Errors (422 Unprocessable Entity) without explicit errors dict
      if (axiosErr.response.status === 422) {
        result.isValidationError = true;
        result.message = data?.message || data?.error || 'Please correct the invalid input fields below.';
        return result;
      }

      // Handle 401 Unauthorized
      if (axiosErr.response.status === 401) {
        result.message = data?.message || 'Your session has expired. Please sign in again.';
        return result;
      }

      // Handle 403 Forbidden
      if (axiosErr.response.status === 403) {
        result.message = data?.message || 'You do not have administrative clearance to access this resource.';
        return result;
      }

      // Handle 404 Not Found
      if (axiosErr.response.status === 404) {
        result.message = data?.message || 'The requested resource could not be found.';
        return result;
      }

      // Handle 500 Server Errors
      if (axiosErr.response.status >= 500) {
        result.message = data?.message || 'Internal server error encountered. Check backend logs.';
        return result;
      }

      // Any other API status code
      result.message = data?.message || `Request failed with status ${axiosErr.response.status}.`;
      return result;
    }

    // Network / Offline / Timeout error
    if (axiosErr.code === 'ECONNABORTED' || axiosErr.message.includes('timeout')) {
      result.isNetworkError = true;
      result.message = 'The server took too long to respond. Please check your connection and retry.';
      return result;
    }

    if (axiosErr.message === 'Network Error' || !axiosErr.response) {
      result.isNetworkError = true;
      result.message = 'Unable to reach the backend API. Please verify the Laravel server is running on http://localhost:8000.';
      return result;
    }
  }

  if (error instanceof Error) {
    result.message = error.message;
    return result;
  }

  if (typeof error === 'string') {
    result.message = error;
    return result;
  }

  return result;
}
