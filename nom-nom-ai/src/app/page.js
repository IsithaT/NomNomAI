"use client";
import Image from "next/image";
import { useState } from "react";
import "./App.css";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

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

        
        <section className="bold-text bg-[#d6b285] px-6 py-4 rounded-lg shadow-lg">
          <h1 className="text-white text-2xl font-bold mb-2 text-center">
            Upload Your Recipe Here!
          </h1>
          <div className="mt-2 text-gray-500 flex flex-col items-center">
            <input
              type="file"
              onChange={handleFileChange}
              className="border border-gray-400 p-2 rounded-md bg-white cursor-pointer"
            />
            {selectedFile && (
              <p className="text-gray-700 mt-2">Selected File: {selectedFile.name}</p>
            )}
          </div>
        </section>

        {/* Button in the Center */}
        <button className="bg-[#437dcf] text-white px-28 py-7 text-lg rounded-lg shadow-md hover:bg-blue-600 font-bold transition">
          Tap to Speak!
        </button>
      </div>
    </section>
  );
}
