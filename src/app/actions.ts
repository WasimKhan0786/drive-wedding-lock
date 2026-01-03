"use server";

import { cookies } from "next/headers";
import { deleteVideoResource, getCloudinaryUsage } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (email === "wasimkham7861@gmail.com" && password === "wasim0786") {
    const cookieStore = await cookies();
    cookieStore.set("auth_token", "unlocked", { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
    });
    return { success: true };
  }
  
  return { success: false, error: "Invalid credentials" };
}

export async function deleteVideoAction(publicId: string) {
  try {
    await deleteVideoResource(publicId);
    revalidatePath("/gallery"); 
    revalidatePath("/upload"); 
    return { success: true };
  } catch (error) {
    console.error("Failed to delete video:", error);
    return { success: false, error: "Failed to delete video" };
  }
}

export async function getUsageAction() {
    try {
        const usage = await getCloudinaryUsage();
        return { success: true, data: usage };
    } catch (error) {
        return { success: false, error: "Failed to fetch usage" };
    }
}
