export function extractErrorMessage(error: any, defaultMessage: string = 'An error occurred'): string {
  if (!error) {
    return defaultMessage;
  }

  if (error.response) {
    const data = error.response.data;
    
    if (data?.details && Array.isArray(data.details)) {
      const validationErrors = data.details.map((err: any) => {
        const field = err.field || err.loc?.join('.') || 'field';
        const message = err.message || err.msg || 'validation error';
        return `${field}: ${message}`;
      }).join(', ');
      return validationErrors || data.message || defaultMessage;
    }
    
    if (data?.detail) {
      if (Array.isArray(data.detail)) {
        const validationErrors = data.detail.map((err: any) => {
          const field = err.loc?.join('.') || err.field || 'field';
          const message = err.msg || err.message || 'validation error';
          return `${field}: ${message}`;
        }).join(', ');
        return validationErrors || String(data.detail);
      }
      return String(data.detail);
    }
    
    return data?.message || 
           data?.error ||
           error.message || 
           defaultMessage;
  }

  if (error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
}





