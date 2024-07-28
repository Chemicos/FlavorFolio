import { collection, getDocs } from "@firebase/firestore";
import jsPDF from "jspdf"
import 'jspdf-autotable'
import { useEffect, useState } from "react";
import { db } from "../../../firebase-config";

export default function FollowersReport() {
  const [followersReport, setFollowersReport] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const followersSnapshot = await getDocs(collection(db, 'followers'));
        const followingSnapshot = await getDocs(collection(db, 'following'));

        let followersData = {};

        usersSnapshot.forEach(doc => {
          const data = doc.data();
          followersData[doc.id] = {
            userId: doc.id,
            username: data.username,
            totalFollowers: 0,
            totalFollowedUsers: 0
          };
        });

        followersSnapshot.forEach(doc => {
          const data = doc.data();
          if (followersData[doc.id]) {
            followersData[doc.id].totalFollowers = data.followers ? data.followers.length : 0;
          }
        });

        followingSnapshot.forEach(doc => {
          const data = doc.data();
          if (followersData[doc.id]) {
            followersData[doc.id].totalFollowedUsers = data.followedUsers ? data.followedUsers.length : 0;
          }
        });

        setFollowersReport(Object.values(followersData));
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Followers Report', 14, 16);
    const tableData = followersReport.map((user, index) => [
      index + 1,
      user.userId,
      user.username,
      user.totalFollowers,
      user.totalFollowedUsers
    ]);

    doc.autoTable({
      startY: 30,
      head: [['#', 'User ID', 'Username', 'Total Followers', 'Total Followed Users']],
      body: tableData,
    });
    doc.save('followers_report.pdf');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center">
        <h2 className="font-semibold text-xl dark:text-dark-border">Urmaritori</h2>
        <button onClick={generatePDF} className="ml-auto font-semibold bg-ff-btn rounded-xl py-2 px-3 hover:bg-ff-content duration-100">PDF</button>
      </div>

      <div className="overflow-x-auto">
        {followersReport.length > 0 ? (
          <table className="min-w-full bg-ff-content dark:bg-dark-elements rounded-t-lg">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">#</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">ID</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">Nume Utilizator</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">Urmaritori</th>
                <th className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">Utilizatori Urmariti</th>
              </tr>
            </thead>
            <tbody>
              {followersReport.map((user, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b text-center border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">{index + 1}</td>
                  <td className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">{user.userId}</td>
                  <td className="py-2 px-4 border-b border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">{user.username}</td>
                  <td className="py-2 px-4 border-b text-center border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">{user.totalFollowers}</td>
                  <td className="py-2 px-4 border-b text-center border-l border-black border-opacity-20 dark:border-dark-border dark:border-opacity-40 dark:text-dark-border">{user.totalFollowedUsers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="dark:text-dark-border">Loading...</p>
        )}
      </div>
    </div>
  )
}
