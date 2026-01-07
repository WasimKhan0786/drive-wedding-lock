# 💍 Advanced Wedding Video Portal

A secure, premium, and feature-rich platform for hosting, organizing, and sharing high-quality wedding memories. This application provides granular access control, paid download/sharing capabilities, and a powerful administrative dashboard seamlessly integrated into the gallery interface.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-Database-green) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-3.4-38bdf8)

## ✨ Key Features

### � Smart Folder Management

- **Organized Memories:** Group videos into password-protected folders (e.g., "Mehendi", "Reception").
- **Full Control:** Admins can **Create**, **Rename**, **Password Protect**, and **Delete** folders.
- **Drag & Drop Logic:** Seamlessly **Move** videos between folders or back to the Main Gallery (Root) with a single click.

### 👑 "God Mode" Administration

- **Full Power Access:** Once logged in as Author, browse **ALL** folders and videos without ever entering a password again.
- **Instant Management:** Admin controls (**Delete**, **Hide/Unhide**, **Move**) are available directly on the video thumbnails—no need to open the video first.
- **Auto-Cleanup:** Moving a video automatically handles its removal from the source and placement in the destination.
- **Secure & Persistent:** Admin session stays active across navigation but clears securely upon Logout.

### 🔒 Premium Security & Access

- **Granular Locking:** Every video and folder can have its own unique password.
- **Monetization / Cost Recovery:**
  - **Paid Downloads:** Users pay a small fee (via Razorpay/PhonePe) to download 4K/HD originals.
  - **Paid Sharing:** Secure "Unlock to Share" links to prevent unauthorized distribution.
- **Deep Linking:** Shared links redirect safely back to the portal.

### 🎨 Stunning UI/UX

- **Glassmorphism Design:** Modern, translucent aesthetics with gold/purple accents.
- **Dynamic Animations:** Heartbeat tokens, shimmering text, and smooth transitions.
- **Responsive:** Fully optimized for Mobile, Tablet, and Desktop.

## 🛠 Technology Stack

- **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Custom CSS Animations, Lucide React (Icons)
- **Database:** MongoDB (Mongoose ODM)
- **State Management:** React Hooks (`useTransition`, `useState`) + Server Actions
- **Payments:** Razorpay SDK, PhonePe Integration
- **Storage:** Cloudinary (Media), Dropbox API (Backup/Source)

## 📦 Installation & Setup

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/WasimKh86/drive-wedding-lock.git
    cd video-portal
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory:

    ```env
    # Database
    MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/wedding-portal

    # Payments (Razorpay)
    NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
    RAZORPAY_KEY_SECRET=...

    # Payments (PhonePe)
    PHONEPE_MERCHANT_ID=...
    PHONEPE_SALT_KEY=...

    # Admin Secrets
    ADMIN_SECRET_CODE=7004636112
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000`.

## 📝 Usage Guide

- **Guest Mode:** Browse the gallery. Properties are locked. Click a video/folder and enter the specific password to view.
- **Admin/Author Mode:**
  1.  Click the **"Sync" Button** (or specific Admin entry point).
  2.  Enter the **Super Admin Code**.
  3.  **Enjoy Full Power:**
      - Navigate freely without locks.
      - Use the **Trash Icon** on cards to delete unwanted content.
      - Use the **Move Icon** to organize videos.
      - Use the **Eye Icon** to hide/unhide videos from guests.
  4.  Click the floating **Logout** button (top-right) to exit secure mode.

## 🤝 Contribution

Feel free to submit issues and enhancement requests.

---

_Managed & Developed with ❤️ for preserving timeless memories._
