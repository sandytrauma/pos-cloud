// Location: app/api/auth/[...nextauth]/route.ts
import { handlers } from "../../../../lib/auth"; // 4 levels back steps cleanly out of the 'app' folder to the project root

export const { GET, POST } = handlers;