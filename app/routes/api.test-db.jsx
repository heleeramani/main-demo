import { connectDB } from "../db.server";

export async function loader() {
  await connectDB();

  return Response.json({
    success: true,
    message: "MongoDB connected successfully",
  });
}