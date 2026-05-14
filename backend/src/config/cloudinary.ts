import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary once at startup so every upload helper can reuse the same client.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Upload a buffer directly to Cloudinary and return the public URL plus public id.
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    // upload_stream is the right choice when Multer gives us a buffer instead of a file path.
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        // resource_type: "auto" detects whether it's an image or video
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    // Pipe the file buffer into the stream and finish the upload.
    stream.end(buffer);
  });
}

// Delete an asset from Cloudinary when the matching record is removed locally.
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
