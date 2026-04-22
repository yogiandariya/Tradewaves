import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVLhpih_82QLy1b0xueCL1MEHS1mqh9cQ",
  authDomain: "paper-trading-3139e.firebaseapp.com",
  projectId: "paper-trading-3139e",
  storageBucket: "paper-trading-3139e.firebasestorage.app",
  messagingSenderId: "975613060450",
  appId: "1:975613060450:web:81afd46ad9f2bd1061783b",
  measurementId: "G-6QDBMXV43L"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);



// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyBNsO4c1Qjxypo6udo5T5KVQvVkZ3E8KzU",
//   authDomain: "paper-trading-54e2a.firebaseapp.com",
//   projectId: "paper-trading-54e2a",
//   storageBucket: "paper-trading-54e2a.firebasestorage.app",
//   messagingSenderId: "981377769395",
//   appId: "1:981377769395:web:9b30aed32d0e182b1335c6",
//   measurementId: "G-L7VT4SZ9RD"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);