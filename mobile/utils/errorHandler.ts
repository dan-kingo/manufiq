export function getErrorMessage(error: any, defaultMessage: string = 'An error occurred. Please try again.'): string {
  const errorData = error?.response?.data;
  return errorData?.details || errorData?.error || error?.message || defaultMessage;
}
