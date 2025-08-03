# MoodMenu 🍽️✨

MoodMenu is an AI-powered web application that suggests recipes based on your current mood. It leverages Google Gemini AI and curated recipe sources to help users discover the perfect meal for every feeling.

## Features 🌟

- **Mood-Based Recipe Suggestions:** Get personalized recipes tailored to your emotions (comfort, quick, healthy, etc.) 😋
- **AI Integration:** Uses Google Gemini for smart recommendations and explanations 🤖
- **Ingredient Substitution Helper:** Find alternatives for ingredients you don’t have 🥕➡️🍋
- **User Profiles & Preferences:** Save dietary restrictions and track your culinary journey 👤🍴
- **History & Analytics:** View your past moods, recipes, ratings, and discover trends 📊
- **Secure Authentication:** JWT-based login/signup with password hashing 🔒
- **Modern UI:** Built with React, Tailwind CSS, and Vite for a fast, responsive experience ⚡

## Project Structure 🗂️

```
frontend/   # React app (Vite, Tailwind, Zustand, etc.)
backend/    # Node.js/Express API (MongoDB, Gemini AI, Spoonacular)
```

## Getting Started 🚀

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure environment variables:**

   ### Backend (`backend/.env`) 🔙
   - `MONGO_URI` — MongoDB connection string
   - `JWT_SECRET` — Secret key for JWT authentication
   - `GEMINI_API_KEY` — Google Gemini API key
   - `SPOONACULAR_API_KEY` — Spoonacular API key
   - `UNSPLASH_ACCESS_KEY` — Unsplash API key (for images, optional)
   - `PEXELS_API_KEY` — Pexels API key (for images, optional)
   - `PORT` — (optional) API server port, default is `4000`

   ### Frontend (`frontend/.env`) 🖥️
   - `VITE_API_URL` — Base URL for backend API (e.g. `http://localhost:4000/api`)

3. **Run the backend:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Run the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the app:**
   - Frontend: [http://localhost:5173](http://localhost:5173) 🌐
   - Backend API: [http://localhost:4000](http://localhost:4000) 🛠️

## Technologies Used 🧑‍💻

- **Frontend:** React, Vite, Tailwind CSS, Zustand, React Router
- **Backend:** Node.js, Express, MongoDB, Google Gemini API, Spoonacular API
- **Authentication:** JWT, bcrypt
- **Other:** Axios, react-hot-toast, Lucide icons

## Contributing 🤝

Pull requests and issues are welcome! Please open an issue for bugs or feature requests.

## License 📄

MIT

---

Enjoy cooking & discovering new moods!