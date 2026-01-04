---
description: How to deploy the Video Portal application to Vercel
---

# Deploying to Vercel

Follow these steps to deploy your application to Vercel with MongoDB and YouTube Upload support.

## Prerequisites

1.  **GitHub Repository**: Ensure your project is pushed to GitHub.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
3.  **MongoDB Atlas URI**: You already have this (`mongodb+srv://...`).
4.  **Google Cloud Keys**: You have these (`GOOGLE_CLIENT_ID`, `GOOGLE_REFRESH_TOKEN`, etc.).

## Steps

1.  **Push Code to GitHub**:

    ```bash
    git add .
    git commit -m "Ready for deployment with MongoDB"
    git push origin main
    ```

2.  **Import Project in Vercel**:

    - Go to Vercel Dashboard > "Add New..." > "Project".
    - Select your GitHub repository.

3.  **Configure Project**:

    - **Framework Preset**: Next.js (Should be auto-detected).
    - **Root Directory**: `video-portal` (Since your app is in a subfolder).

4.  **Environment Variables (CRITICAL)**:

    - Expand the **"Environment Variables"** section.
    - Add the following keys from your `.env.local` file:
      - `MONGODB_URI`
      - `GOOGLE_CLIENT_ID`
      - `GOOGLE_CLIENT_SECRET`
      - `GOOGLE_REDIRECT_URI` (Set this to your Vercel URL + `/api/auth/callback/google` later, or keep localhost for dev. _Note: You might need to add the Vercel domain to Google Cloud Console "Authorized Redirect URIs"_)
      - `GOOGLE_REFRESH_TOKEN`
      - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (If using any Cloudinary features)

5.  **Deploy**:
    - Click **"Deploy"**.

## Post-Deployment

- Once deployed, Vercel will give you a domain (e.g., `your-app.vercel.app`).
- **Update Google Cloud Console**:
  - Go to Google Cloud Console > APIs & Services > Credentials.
  - Edit your OAuth 2.0 Client.
  - Add your Vercel domain to **"Authorized JavaScript origins"**.
  - Add `https://your-app.vercel.app/api/auth/callback/google` to **"Authorized redirect URIs"**.
