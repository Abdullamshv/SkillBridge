export function friendlyError(err: unknown): string {
  // Apollo v4 wraps GraphQL errors in CombinedGraphQLErrors with an `errors`
  // array — the backend's own messages ("Invalid credentials", "Username
  // already taken", …) live there and are already human-readable.
  if (err && typeof err === "object" && "errors" in err) {
    const list = (err as { errors?: { message?: string }[] }).errors;
    if (list?.length && list[0]?.message) return list[0].message;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong — please try again.";
}
