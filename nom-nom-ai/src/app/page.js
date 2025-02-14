import Image from "next/image";
import "./App.css";

export default function Home() {
  return (
    <section className="min-h-screen bg-[#fff88e] flex items-start justify-center">
      <h1 className="text-[#437dcf] text-8xl bold-text transform scale-105 pt-20 ">NomNomAI</h1>
      <div>
        {/*add logo here*/}
      </div>
      <div>
        {/* add button for speaking here */}
      </div>  
      <div>
        {/* Upload recipe here*/}
      </div>
    </section>
  );
}