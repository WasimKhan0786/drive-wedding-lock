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
      // Deleting from MongoDB
      const { default: connectToDatabase } = await import("@/lib/db");
      const { default: Video } = await import("@/models/Video");
      const { default: DeletedVideo } = await import("@/models/DeletedVideo");

      await connectToDatabase();
      
      // 1. Find the video first to blacklist it
      const videoToDelete = await Video.findOne({ 
        $or: [{ videoId: publicId }, { id: publicId }] 
      });

      if (videoToDelete && videoToDelete.youtubeId) {
          // 2. Add to Blacklist
          await DeletedVideo.findOneAndUpdate(
              { youtubeId: videoToDelete.youtubeId },
              { youtubeId: videoToDelete.youtubeId, deletedAt: new Date() },
              { upsert: true, new: true }
          );
      }

      // 3. Delete from Gallery
      const result = await Video.deleteOne({ 
          $or: [{ videoId: publicId }, { id: publicId }] 
      });

      if (result.deletedCount === 0) {
           return { success: false, error: "Video not found in database" };
      }

      // NOTE: We are NOT deleting from YouTube because standard API quota is strict.
      // We just remove the reference from our app so it doesn't show up.

    revalidatePath("/gallery"); 
    revalidatePath("/upload"); 
    return { success: true };
  } catch (error) {
    console.error("Failed to delete video:", error);
    return { success: false, error: "Failed to delete video" };
  }
}

export async function updateVideoPasswordAction(publicId: string, newPassword: string) {
   try {
       const { default: connectToDatabase } = await import("@/lib/db");
       const { default: Video } = await import("@/models/Video");
       
       await connectToDatabase();
       
       const result = await Video.findOneAndUpdate(
           { $or: [{ videoId: publicId }, { id: publicId }, { public_id: publicId }] },
           { $set: { password: newPassword } },
           { new: true }
       );
       
       if (!result) {
           return { success: false, error: "Video not found" };
       }
       
       revalidatePath("/gallery");
       return { success: true };
   } catch (error) {
       console.error("Failed to update password:", error);
       return { success: false, error: "Failed to update password" };
   }
}

export async function toggleVideoVisibilityAction(publicId: string, hidden: boolean) {
   try {
       const { default: connectToDatabase } = await import("@/lib/db");
       const { default: Video } = await import("@/models/Video");
       
       await connectToDatabase();
       
       const result = await Video.findOneAndUpdate(
           { $or: [{ videoId: publicId }, { id: publicId }, { public_id: publicId }] },
           { $set: { hidden: hidden } },
           { new: true }
       );
       
       if (!result) {
           return { success: false, error: "Video not found" };
       }
       
       revalidatePath("/gallery");
       return { success: true };
   } catch (error) {
       console.error("Failed to toggle visibility:", error);
       return { success: false, error: "Failed to toggle visibility" };
   }
}

export async function getUsageAction() {
    try {
        const { getDropboxUsage } = await import("@/lib/dropbox");
        const usage = await getDropboxUsage();
        return { success: true, data: usage };
    } catch (error) {
        return { success: false, error: "Failed to fetch usage" };
    }
}

export async function createFolderAction(name: string, password: string) {
    try {
        const { default: connectToDatabase } = await import("@/lib/db");
        const { default: Folder } = await import("@/models/Folder");
        await connectToDatabase();
        
        await Folder.create({ name, password });
        revalidatePath("/gallery");
        return { success: true };
    } catch (error) {
        console.error("Failed to create folder:", error);
        return { success: false, error: "Failed to create folder" };
    }
}

export async function moveVideoToFolderAction(publicId: string, folderId: string | null) {
    try {
        const { default: connectToDatabase } = await import("@/lib/db");
        const { default: Video } = await import("@/models/Video");
        await connectToDatabase();
        
        const updateData: any = { folderId: folderId };
        if (folderId) {
            updateData.password = ""; // Remove password if moving to a folder
            updateData.hidden = false; // Optional: Unhide if hidden?
        }

        const result = await Video.findOneAndUpdate(
            { $or: [{ videoId: publicId }, { id: publicId }, { public_id: publicId }] },
            { $set: updateData },
            { new: true }
        );
        
        if (!result) return { success: false, error: "Video not found" };
        
        revalidatePath("/gallery");
        return { success: true };
    } catch (error) {
        console.error("Failed to move video:", error);
        return { success: false, error: "Failed to move video" };
    }
}

export async function renameFolderAction(folderId: string, newName: string) {
    try {
        const { default: connectToDatabase } = await import("@/lib/db");
        const { default: Folder } = await import("@/models/Folder");
        await connectToDatabase();
        
        await Folder.findByIdAndUpdate(folderId, { name: newName });
        revalidatePath("/gallery");
        return { success: true };
    } catch (error) {
        console.error("Failed to rename folder:", error);
        return { success: false, error: "Failed to rename folder" };
    }
}

export async function updateFolderPasswordAction(folderId: string, newPassword: string) {
    try {
        const { default: connectToDatabase } = await import("@/lib/db");
        const { default: Folder } = await import("@/models/Folder");
        await connectToDatabase();
        
        await Folder.findByIdAndUpdate(folderId, { password: newPassword });
        revalidatePath("/gallery");
        return { success: true };
    } catch (error) {
        console.error("Failed to update folder password:", error);
        return { success: false, error: "Failed to update folder password" };
    }
}

export async function deleteFolderAction(folderId: string) {
    try {
        const { default: connectToDatabase } = await import("@/lib/db");
        const { default: Folder } = await import("@/models/Folder");
        const { default: Video } = await import("@/models/Video");
        await connectToDatabase();
        
        // Move videos inside this folder to root (maintain data safety)
        await Video.updateMany({ folderId: folderId }, { $set: { folderId: null } });
        
        await Folder.findByIdAndDelete(folderId);
        revalidatePath("/gallery");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete folder:", error);
        return { success: false, error: "Failed to delete folder" };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    revalidatePath("/");
    return { success: true };
}
