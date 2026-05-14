// upload.controller.ts: handles controllers functionality.
import type { Request, Response } from "express";
import { uploadToCloudinary , deleteFromCloudinary } from "../config/cloudinary.js";
import prisma from "../config/prisma.js";


// Upload a user avatar, store the Cloudinary metadata, and persist the URL on the user record.
// uploadAvatar: handles upload avatar.
export async function uploadAvatar(req: Request, res: Response) {
  const id = req.params["id"] as string;

  // req.file is set by Multer — if it's missing, no file was sent
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const user = await prisma.user.findUnique({ where: { id: id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Upload the buffer to Cloudinary under the "airbnb/avatars" folder
  const { url, publicId } = await uploadToCloudinary(
    req.file.buffer,
    "airbnb/avatars"
  );

  // Save the Cloudinary URL to the user's record in the database
  const updated = await prisma.user.update({
    where: { id: id },
    data: {
       avatar: url, 
        avatarPublicId: publicId, 
    },
  });

  res.json({ message: "Avatar uploaded successfully", avatar: url });
}

// Delete a user avatar from both Cloudinary and the database.
// deleteAvatar: handles delete avatar.
export async function deleteAvatar(req: Request, res: Response) {
  const id = req.params["id"] as string;

  const user = await prisma.user.findUnique({ where: { id: id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Here you would also want to delete the image from Cloudinary using the publicId
  // For simplicity, we're just removing the URL from the database

  const updated = await prisma.user.update({
    where: { id: id },
    data: { avatar: null, avatarPublicId: null },
  });

  if (user.avatarPublicId) {
    await deleteFromCloudinary(user.avatarPublicId);
  }

  res.json({ message: "Avatar deleted successfully" });
}

// Upload an image for a listing and create a linked photo row.
// uploadListingImage: handles upload listing image.
export async function uploadListingImage(req: Request, res: Response) {
  const id = req.params["id"] as string;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const listing = await prisma.listing.findUnique({ where: { id: id } });
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  const { url, publicId } = await uploadToCloudinary(
    req.file.buffer,
    "airbnb/listings"
  );

  // Save the new image URL to the listing's images array
  const updated = await prisma.listingPhoto.create({
    data: { listingId: listing.id, url, publicId },
  });

  res.json({ message: "Image uploaded successfully", imageUrl: url });
}

// Remove a listing image record and delete the external asset when possible.
// deleteListingImage: handles delete listing image.
export async function deleteListingImage(req: Request, res: Response) {
  const id = req.params["id"] as string;

  const photo = await prisma.listingPhoto.findUnique({ where: { id: id }, select: { id: true, publicId: true } });
  if (!photo) {
    return res.status(404).json({ error: "Image not found" });
  }
  
  const deleted = await prisma.listingPhoto.delete({ where: { id: id } });

  if (photo.publicId) {
    await deleteFromCloudinary(photo.publicId);
  }

  res.json({ message: "Image deleted successfully" });
}