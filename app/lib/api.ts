export function getApiBase() {
  if (typeof window !== "undefined") {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "/api";
    }
  }

  const appRunnerUrl = process.env.NEXT_PUBLIC_APP_RUNNER_URL;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  if (appRunnerUrl && appRunnerUrl.trim() !== "") {
    const url = appRunnerUrl.startsWith("http")
      ? appRunnerUrl
      : `https://${appRunnerUrl}`;
    return url.endsWith("/api") ? url : `${url}/api`;
  }

  if (apiBase && apiBase.trim() !== "") {
    return apiBase;
  }

  return "https://7mnzh94kp5.execute-api.us-east-1.amazonaws.com/api";
}
