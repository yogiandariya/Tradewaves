import Navbar from "./UserNavbar/Navbar";
import PageContent from "./UserPageContent/PageContent";
import Footer from "./UserFooter/UserFooter";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { auth, db } from "../../Firebase";
import { collection, onSnapshot, query, where, updateDoc, doc } from "firebase/firestore";

function Home() {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, "queries"),
      where("userId", "==", user.uid),
      where("notifyUser", "==", true)
    );
    const unsub = onSnapshot(q, (snap) => {
      snap.forEach(async (d) => {
        const data = d.data();
        if (data.adminResponse) {
          alert(`Admin response: ${data.adminResponse}`);
          try {
            await updateDoc(doc(db, "queries", d.id), { notifyUser: false });
          } catch {}
        }
      });
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <Navbar />
      <PageContent>
        <Outlet />
      </PageContent>
      <Footer />
    </div>
  );
}

export default Home;
