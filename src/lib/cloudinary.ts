import { v2 as cloudinary } from 'cloudinary';

// Cloudinary will automatically pick up CLOUDINARY_URL from the environment variables.
// If you need explicit configuration, ensure the variables are set.
const cloudinaryConfig = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
};

// Apply config if CLOUDINARY_URL is missing
if (!process.env.CLOUDINARY_URL) {
    cloudinary.config(cloudinaryConfig);
}

export async function getVideos() {
  try {
    const results = await cloudinary.search
      .expression('resource_type:video')
      .sort_by('created_at', 'desc')
      .max_results(30)
      .execute();

    // Map to a simple serializable object
    return results.resources.map((resource: any) => ({
        public_id: resource.public_id,
        secure_url: resource.secure_url,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        duration: resource.duration || 0,
    }));
  } catch (error: any) {
    console.error("Error fetching videos from Cloudinary:", error.message || error);
    return [];
  }
}

export async function deleteVideoResource(public_id: string) {
    try {
        const result = await cloudinary.uploader.destroy(public_id, { resource_type: 'video' });
        return result;
    } catch (error: any) {
        console.error("Error deleting video:", error);
        throw new Error(error.message || "Failed to delete video");
    }
}

export async function getCloudinaryUsage() {
    try {
        const result = await cloudinary.api.usage();
        return {
            plan: result.plan,
            credits: {
                usage: result.credits?.usage || 0,
                limit: result.credits?.limit || 25,
                used_percent: result.credits?.used_percent || 0
            },
            storage: {
                usage: result.storage?.usage || 0, // bytes
                credits_usage: result.storage?.credits_usage || 0
            }
        };
    } catch (error: any) {
        console.error("Error fetching usage:", error);
        return null;
    }
}
