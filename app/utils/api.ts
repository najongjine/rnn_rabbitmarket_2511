export const fetchWithTimeout = async (
  resource: RequestInfo,
  options: RequestInit = {},
) => {
  const { timeout = 10000 } = options as any; // 10 seconds default

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    // clearTimeout(id); // Usually handled in finally, but good consistent practice
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
};
