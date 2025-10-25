# COOUCart ✨

## Overview
COOUCart is a modern, cross-platform mobile marketplace application built with React Native and Expo. It provides a dynamic platform for users to either sell products as a business or explore and purchase items as a customer. Featuring real-time chat for buyer-seller communication, robust product management, and a comprehensive transaction history, COOUCart offers a secure and interactive e-commerce experience powered by Supabase for backend services.

## Features
- 🛒 **Intuitive Product Marketplace**: Seamless browsing, searching, and filtering of products by category and price.
- 🧑‍💼 **Role-Based Authentication**: Distinct experiences for customers (buyers) and businesses (sellers) with dedicated functionalities.
- 💬 **Real-time Chat System**: Direct, instant messaging capabilities between buyers and sellers to facilitate product inquiries and negotiations.
- 🖼️ **Product Management**: Businesses can easily add new listings, update product details, and delete items, including image uploads.
- 📈 **Transaction History**: Customers can track the status of their ongoing and completed purchases in a dedicated "My Transactions" section.
- ⭐ **Business Rating System**: Customers have the ability to rate businesses after a transaction is closed, contributing to a transparent marketplace.
- 🛡️ **Secure Data Handling**: Leverages Supabase for robust user authentication, profile management, and database operations.

## Technologies Used
| Technology                                      | Description                                                 |
| :---------------------------------------------- | :---------------------------------------------------------- |
| <a href="https://reactnative.dev/" target="_blank">React Native</a> | Framework for building native mobile apps using JavaScript  |
| <a href="https://expo.dev/" target="_blank">Expo</a>              | Universal platform for creating and deploying React apps    |
| <a href="https://www.typescriptlang.org/" target="_blank">TypeScript</a> | Statically typed superset of JavaScript for better code quality |
| <a href="https://supabase.com/" target="_blank">Supabase</a>      | Open-source Firebase alternative for auth, database, and storage |
| <a href="https://expo.github.io/router/" target="_blank">Expo Router</a> | File-system based routing for universal React applications  |
| <a href="https://github.com/lucide-icons/lucide" target="_blank">Lucide React Native</a> | Beautiful, customizable open-source icon set                |
| <a href="https://nativewind.dev/" target="_blank">NativeWind</a> | Utility-first CSS for React Native, inspired by Tailwind CSS |

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed on your machine:

-   **Node.js**: v18 or higher (includes npm)
-   **npm**: v9 or higher (or Yarn v1.22 or higher)
-   **Expo CLI**: Install globally via npm:
    ```bash
    npm install -g expo-cli
    ```

### Installation
To get a copy of the project up and running on your local machine, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Victormarshall911/COOUCart.git
    ```
2.  **Navigate to Project Directory**:
    ```bash
    cd COOUCart
    ```
3.  **Install Dependencies**:
    ```bash
    npm install # or yarn install
    ```

### Environment Variables
COOUCart relies on Supabase for its backend services. You need to configure your Supabase project and provide the necessary environment variables.

1.  Create a `.env` file in the root of your project.
2.  Add the following variables, replacing the placeholder values with your actual Supabase project URL and Anon Key:

    ```
    EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ```
    You can find these keys in your Supabase project settings under `API Settings`.

### Running the Application
Once the dependencies are installed and environment variables are set, you can run the application:

```bash
npm run dev # or yarn dev
```
This command will launch the Expo Development Server in your web browser. From there, you can:
-   Scan the QR code with the **Expo Go** app on your iOS or Android device.
-   Run the app on an iOS simulator (requires Xcode) or Android emulator (requires Android Studio).
-   Open the app directly in your web browser (might have limited functionality for some native features).

## Usage

### User Roles
COOUCart provides two distinct user experiences based on the selected role during registration:

-   **Customer Account**: Designed for users who want to browse products, engage with sellers, and make purchases.
-   **Business Account**: Tailored for users who want to list their products, manage inventory, and interact with buyers.

### Registration and Login
When you first open the app, you will be directed to the authentication flow:
1.  **Sign Up**: Enter your full name, email, and a secure password. Crucially, select your account type: `Customer` or `Business`.
2.  **Login**: Use your registered email and password to sign into your account.

### As a Customer
-   **Discover Products**: On the home screen, browse a wide range of products. Use the integrated search bar to find specific items or apply filters by category and price range to refine your search.
-   **Detailed Product View**: Tap on any product to access its dedicated details page, showcasing the full description, current price, and information about the selling business, including its average rating.
-   **Initiate a Purchase**: If you're interested in a product, simply tap the "Buy Now" button on its details page. This action automatically creates a new chat thread with the seller, allowing you to discuss details before committing.
-   **Track Transactions**: Access the "My Transactions" section (via the shopping cart icon) to view a comprehensive list of all your ongoing and completed purchases.
-   **Chat with Sellers**: Engage in real-time conversations with businesses. Once a transaction is finalized (marked as `closed` by the business), you will have the opportunity to rate the business based on your experience.

### As a Business
-   **Manage Your Listings**: Navigate to the "My Products" tab to oversee all the items you currently have listed for sale. Here, you can easily add new products or remove existing ones.
-   **Add New Products**: Provide essential details such as the product title, a detailed description, the selling price, assign it to a category, and upload a compelling image to attract buyers.
-   **Customer Engagement**: The "Chats" tab is your hub for all conversations with potential buyers. Respond promptly to inquiries, negotiate terms, and provide excellent customer service.
-   **Finalize Transactions**: Within an active chat, once a deal is agreed upon and the transaction is complete, you can mark the chat status as "closed."

## Contributing
We welcome contributions to make COOUCart even better! If you're interested in contributing, please follow these guidelines:

-   🌳 Fork the repository.
-   ✨ Create a new branch for your feature or bugfix (`git checkout -b feature/your-feature` or `bugfix/issue-description`).
-   📝 Ensure your code adheres to the project's established coding standards and practices.
-   🧪 If you're adding new functionality, please include relevant tests.
-   🚀 Commit your changes with a clear and concise message (`git commit -m 'feat: Add a new user profile section'`).
-   ⬆️ Push your branch to your forked repository (`git push origin feature/your-feature`).
-   🤝 Open a pull request against the `main` branch of the original repository.

## Author
-   Marshall Victor
    -   LinkedIn: ['https://www.linkedin.com/in/marshall-victor-501460213/']
    -   X: ['https://x.com/marshallvicto18']
    -   Portfolio: ['https://victormarshall911.github.io/Cv/']
[![Facebook](https://web.facebook.com/profile.php?id=61576767331802)]

---
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

