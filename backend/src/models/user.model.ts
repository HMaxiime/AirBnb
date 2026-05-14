export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone: string;
  role: "host" | "guest";
  avatar?: string;
  bio?: string;
}

export const users: User[] = [
  {
    id: 1,
    name: "Alice Mukamana",
    email: "alice@example.com",
    username: "alice_m",
    phone: "+250788000001",
    role: "host",
    avatar: "https://example.com/avatars/alice.jpg",
    bio: "Loves hosting travelers in Kigali.",
  },
  {
    id: 2,
    name: "Bob Nshimiyimana",
    email: "bob@example.com",
    username: "bob_n",
    phone: "+250788000002",
    role: "guest",
  },
  {
    id: 3,
    name: "Charlie Kagabo",
    email: "charlie@example.com",
    username: "charlie_k",
    phone: "+250788000003",
    role: "host",
  },
];
