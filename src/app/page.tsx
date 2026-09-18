import { redirect } from "next/navigation";

/** The playlists screen is what the app is meant to open on. */
export default function Home() {
  redirect("/playlist");
}
