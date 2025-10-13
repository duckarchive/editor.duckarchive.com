import { NextPage } from "next";
import { redirect } from "next/navigation";

const WelcomePage: NextPage = () => {
  redirect("/inspector");
};

export default WelcomePage;
