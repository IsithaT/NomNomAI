import Image from "next/image";
import "./App.css";

export default function Home() {
  return (
    <section className="h-screen bg-[#fff88e] flex flex-col justify-center items-center">
      {/* Centered Content */}
      <div className="flex flex-col items-center gap-6">
        {/* Title */}
        <h1 className="text-[#437dcf] text-8xl bold-text transform scale-105">
          NomNomAI
        </h1>

        {/* Logo */}
        <Image src="/logo.png" alt="Logo" width={200} height={200} />

        {/* Button in the Center */}
        <button className="bg-[#437dcf] text-white px-28 py-7 text-lg rounded-lg shadow-md hover:bg-blue-600 transition">
          Speak
        </button>
      </div>
    </section>
  );
}
