const now = Date.now();

export const initialIssues = [
  {
    id: "CC-10021",
    title: "Large pothole near Sector 9 market",
    description: "Deep pothole causing traffic slowdown and bike falls.",
    category: "Roads",
    status: "In Progress",
    location: "Sector 9, Chandigarh",
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80",
    createdAt: now - 1000 * 60 * 60 * 36,
    timeline: [
      { key: "Submitted", timestamp: now - 1000 * 60 * 60 * 36 },
      { key: "Assigned", timestamp: now - 1000 * 60 * 60 * 20 },
      { key: "In Progress", timestamp: now - 1000 * 60 * 60 * 2 },
    ],
  },
  {
    id: "CC-10018",
    title: "Streetlight not working on main road",
    description: "Entire stretch is dark after 8 PM; unsafe for pedestrians.",
    category: "Streetlight",
    status: "Resolved",
    location: "MG Road, Bengaluru",
    image: "https://images.unsplash.com/photo-1465447142348-e9952c393450?w=800&q=80",
    createdAt: now - 1000 * 60 * 60 * 80,
    timeline: [
      { key: "Submitted", timestamp: now - 1000 * 60 * 60 * 80 },
      { key: "Assigned", timestamp: now - 1000 * 60 * 60 * 60 },
      { key: "In Progress", timestamp: now - 1000 * 60 * 60 * 45 },
      { key: "Resolved", timestamp: now - 1000 * 60 * 60 * 12 },
    ],
  },
  {
    id: "CC-10024",
    title: "Overflowing garbage bin in residential lane",
    description: "Garbage collection missed for 3 days; foul smell spreading.",
    category: "Sanitation",
    status: "Submitted",
    location: "Indiranagar, Bengaluru",
    image: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800&q=80",
    createdAt: now - 1000 * 60 * 60 * 6,
    timeline: [{ key: "Submitted", timestamp: now - 1000 * 60 * 60 * 6 }],
  },
];

export const categories = ["Roads", "Streetlight", "Sanitation", "Water", "Drainage", "Public Safety"];
