# COOUCart Marketplace Mobile App 🛒

A modern, full-stack mobile marketplace application built with Expo and React Native, powered by TypeScript and Supabase. This app connects buyers and sellers, allowing businesses to list products and customers to browse, chat, and rate purchases.

## ✨ Features

*   **User Authentication**: Secure signup and login for both customer and business roles.
*   **Role-Based Access**: Tailored experiences for buyers and sellers, including dedicated dashboards.
*   **Product Listing**: Businesses can easily add products with titles, descriptions, prices, and images.
*   **Marketplace Browsing**: Customers can explore a wide range of products available in the marketplace.
*   **Product Search**: Efficiently find products by title using the integrated search functionality.
*   **Real-time Chat**: Seamless messaging between buyers and sellers to discuss product details and transactions.
*   **Transaction Management**: Businesses can mark chats as completed to finalize sales.
*   **Product & Business Ratings**: Customers can rate businesses and products after a transaction is closed.
*   **Profile Management**: View and manage user details, including role-specific statistics for businesses.
*   **Image Uploads**: Securely upload and display product images using Supabase Storage.

## 🚀 Getting Started

Follow these steps to set up and run the COOUCart Marketplace app on your local machine.

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Victormarshall911/COOUCart.git
    cd COOUCart
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Install Expo Go (if not already installed)**:
    Download the Expo Go app on your iOS or Android device from the App Store or Google Play Store.

### Environment Variables

This project uses Supabase as its backend. You will need to configure your Supabase project keys. Create a `.env` file in the root of your project with the following variables:

*   `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
*   `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Project Anon Key.

**Example `.env` file:**
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...xyz
```

**Supabase Setup (Manual Steps, outside this README's scope but essential):**
1.  Create a new Supabase project.
2.  Enable Email authentication.
3.  Set up `profiles`, `products`, `chats`, `messages`, and `ratings` tables with appropriate RLS policies.
    *   **`profiles` table**: `id (uuid, PK)`, `email (text)`, `full_name (text)`, `role (enum: 'customer', 'business')`
    *   **`products` table**: `id (uuid, PK)`, `title (text)`, `description (text)`, `price (numeric)`, `image_url (text)`, `owner_id (uuid, FK to profiles.id)`, `created_at (timestamp)`
    *   **`chats` table**: `id (uuid, PK)`, `product_id (uuid, FK to products.id)`, `buyer_id (uuid, FK to profiles.id)`, `business_id (uuid, FK to profiles.id)`, `status (enum: 'open', 'closed')`, `created_at (timestamp)`, `updated_at (timestamp)`
    *   **`messages` table**: `id (uuid, PK)`, `chat_id (uuid, FK to chats.id)`, `sender_id (uuid, FK to profiles.id)`, `content (text)`, `created_at (timestamp)`
    *   **`ratings` table**: `id (uuid, PK)`, `chat_id (uuid, FK to chats.id)`, `business_id (uuid, FK to profiles.id)`, `customer_id (uuid, FK to profiles.id)`, `stars (integer)`, `comment (text)`, `created_at (timestamp)`
4.  Configure a Supabase Storage bucket (e.g., `product-images`) for storing product images.

### Running the Application

1.  **Start the Expo Development Server**:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
2.  **Open on Device/Simulator**:
    *   Scan the QR code displayed in your terminal or browser with the Expo Go app on your physical device.
    *   Alternatively, press `i` for iOS simulator or `a` for Android emulator in the terminal.

## 💡 Usage

### Authentication
Upon launching the app, you will be directed to the authentication flow.
*   **Sign Up**: Create a new account by providing your full name, email, password, and selecting your role (Customer or Business).
*   **Sign In**: Use your registered email and password to access the app.

### Customer Experience 🛍️
1.  **Home (Marketplace)**: Browse all available products. Use the search bar to find specific items.
2.  **Product Details**: Tap on any product to view its image, price, detailed description, and seller information.
3.  **Initiate Chat**: From a product's detail page, you can start a conversation with the seller (if you are a customer).
4.  **Chats**: Access all your ongoing and completed conversations with businesses.
5.  **Rating**: After a business completes a transaction (closes a chat), you can submit a star rating and an optional comment for their service.

### Business Experience 💼
1.  **My Products**: View a list of all products you have listed.
2.  **Add Product**: Click the `+` icon to add a new product. Fill in the title, description, price, and upload an image from your device.
3.  **Delete Product**: From your 'My Products' list, you can delete any product you've listed.
4.  **Chats**: Manage conversations with potential buyers.
5.  **Complete Transaction**: Within an active chat, you can mark the transaction as 'closed' once a deal is finalized.
6.  **Profile**: See your business statistics, including the number of products listed and your average customer rating.

## 🛠️ Technologies Used

| Technology             | Description                                         | Link                                                       |
| :--------------------- | :-------------------------------------------------- | :--------------------------------------------------------- |
| **Expo**               | Framework for universal React applications          | [expo.dev](https://expo.dev/)                              |
| **React Native**       | Building native mobile apps with React              | [reactnative.dev](https://reactnative.dev/)                |
| **TypeScript**         | Superset of JavaScript for type safety              | [typescriptlang.org](https://www.typescriptlang.org/)      |
| **Supabase**           | Open Source Firebase Alternative (Auth, DB, Storage)| [supabase.com](https://supabase.com/)                      |
| **Expo Router**        | File-system based router for Expo and React Native  | [expo.fyi/router](https://expo.fyi/router)                 |
| **Lucide React Native**| Customizable SVG icon library                       | [lucide.dev](https://lucide.dev/packages/lucide-react-native)|
| **NativeWind**         | Tailwind CSS for React Native                       | [nativewind.dev](https://www.nativewind.dev/)              |

## 🤝 Contributing

We welcome contributions to COOUCart Marketplace! If you have suggestions or want to improve the project:

*   **Fork** the repository.
*   **Clone** your forked repository.
*   Create a new **branch** for your feature or bug fix.
*   Make your **changes** and ensure tests pass.
*   **Commit** your changes with clear messages.
*   **Push** to your branch.
*   Open a **Pull Request** to the `main` branch of this repository, describing your changes in detail.

## 🧑‍💻 Author

**Victor Marshall**
*   LinkedIn: [https://linkedin.com/in/victormarshall](https://linkedin.com/in/victormarshall)
*   Twitter: [https://twitter.com/victormarshall](https://twitter.com/victormarshall)

## 🛡️ License

This project is licensed under the MIT License.

## 📊 Badges

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
