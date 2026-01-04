# Wedding Video Portal

A secure, premium platform for hosting and sharing high-quality wedding memories. This application allows authorized guests to view protected videos and purchase high-resolution downloads.

## ✨ Features

### 🔒 Secure Access

- **Password Protection:** Every video is protected by a unique password.
- **Admin Controls:** Hidden administration features for managing content securely.
- **Privacy First:** Videos are hidden by default unless unlocked.

### 🎥 Premium Viewing Experience

- **High-Quality Playback:** seamless streaming of HD wedding moments.
- **Mobile Responsive:** Optimized layout for phones, tablets, and desktops.
- **Interactive Gallery:** Beautiful grid layout with glassmorphism UI design.

### 💳 Integrated Payments

- **PhonePe Integration:** Seamless UPI payments for users in India.
- **Razorpay Support:** Robust alternative payment gateway for cards and net banking.
- **Instant Delivery:** Download links are automatically generated upon successful payment.

### 🛠 Admin Features (Hidden)

- **Content Management:** Hide/Unhide videos instantly.
- **Security Management:** Update video passwords on the fly.
- **Video Deletion:** Remove content directly from the interface.
- **Bypass:** Direct download access for administrators without payment.

## � Technology Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Styling:** Tailwind CSS + Custom Animations
- **Payments:** PhonePe API & Razorpay SDK
- **Storage:** Cloudinary / YouTube Embeds

## 📦 Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/WasimKh86/drive-wedding-lock.git
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up Environment Variables (`.env.local`):

    ```env
    MONGODB_URI=your_mongodb_connection_string
    NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
    PHONEPE_CLIENT_ID=your_phonepe_client_id
    PHONEPE_CLIENT_SECRET=your_phonepe_secret
    EMAIL_USER=your_email_for_notifications
    ```

4.  Run the development server:

    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Usage

- **For Guests:** Click on any video card and enter the password provided to you to unlock and watch.
- **To Download:** Click the 'Download' button on any video. A small fee is required to support the platform hosting.
- **For Admins:** Use your specialized access code to manage the gallery directly from the frontend.

---

_Built with ❤️ for preserving beautiful memories._
