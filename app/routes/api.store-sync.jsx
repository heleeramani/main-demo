import { authenticate } from "../shopify.server";
import { syncStore } from "../controllers/store.controller";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  return syncStore({
    admin,
    session,
  });
}