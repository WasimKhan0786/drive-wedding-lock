# Forever & Always - Wedding Video Portal

A premium, secure, and permanent video gallery designed for wedding memories. This portal allows guests and family to upload and watch wedding videos in high quality (4K) with a lifetime retention guarantee.

## 🌟 Key Features

- **Premium Aesthetic**: Gold and Black glassmorphism design with smooth animations.
- **Secure Access**: Protected by a 2-step login system (Email & Password).
- **Lifetime Storage**: Videos are stored permanently on Cloudinary and never deleted.
- **4K Support**: Upload high-quality videos (up to 50GB per file) with auto-transcoding.
- **Adaptive Streaming**: Auto-quality selection (Auto, 4K, 1080p, 720p, 360p) for smooth playback on any device.
- **Progressive Web App**: Fast loading with a "Heart" splash screen and optimized performance.
- **Strict Security**:
  - **No Delete Option**: Deletion is disabled in both UI and Server to prevent accidents.
  - **Authenticated Access**: Login required to view or upload content.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Styling**: Vanilla CSS (Animation-heavy, Responsive) using CSS Modules/Global Styles.
- **Storage & CDN**: [Cloudinary](https://cloudinary.com/) (Video API)
- **Icons**: Lucide React
- **Deployment**: Vercel Ready

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed.
- A Cloudinary account (Free tier works great).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Start-Wasim/video-portal.git
    cd video-portal
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Setup Environment Variables:**
    Create a `.env.local` file in the root directory and add your Cloudinary credentials (see `env_example.txt`):

    ```env
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
    NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    CLOUDINARY_URL=cloudinary://...
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
    ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## ☁️ Deployment on Vercel

1.  Push your code to **GitHub**.
2.  Import the project on **Vercel**.
3.  Add the **Environment Variables** (from step 3 above) in Vercel Project Settings.
4.  Click **Deploy**.

---

_Developed with ❤️ for timeless memories._
