"use client";
import Image from "next/image";
import { useState } from "react";
import { getDocument } from "pdfjs-dist/webpack"; // Import pdf.js
import "./App.css"

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [extractedText, setExtractedText] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file); // Create URL for display
      setPdfUrl(objectUrl);

      // Extract text from PDF
      const reader = new FileReader();
      reader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await getDocument(typedArray).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item) => item.str).join(" ");
          fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
        }

        setExtractedText(fullText);
      };

      reader.readAsArrayBuffer(file);
    } else {
      setExtractedText("Please upload a valid PDF file.");
      setPdfUrl(null);
    }
  };

  return (
    <section className="min-h-screen bg-[#fff88e] flex flex-col justify-center items-center py-10">
      <div className="flex flex-col items-center gap-6">
        {/* Title */}
        <h1 className="text-[#437dcf] text-8xl bold-text transform scale-105">
          NomNomAI
        </h1>

        {/* Logo */}
        <Image src="/logo.png" alt="Logo" width={200} height={200} />

        {/* Upload Recipe Section */}
        <section className="bold-text bg-[#d6b285] px-6 py-4 rounded-lg shadow-lg">
          <h1 className="text-white text-2xl font-bold mb-2 text-center">
            Upload Your Recipe Here!
          </h1>
          <div className="mt-2 text-gray-500 flex flex-col items-center">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="border border-gray-400 p-2 rounded-md bg-white cursor-pointer"
            />
            {selectedFile && (
              <p className="text-gray-700 mt-2">Selected File: {selectedFile.name}</p>
            )}
          </div>
        </section>

        {/* PDF Viewer using iframe */}
        {pdfUrl && (
          <div className="bg-[#d6b285] p-4 mt-4 rounded-lg shadow-md max-w-3xl w-full">
            <h2 className="text-white font-bold text-2xl">Your Recipe:</h2>
            <iframe
              src={pdfUrl}
              width="100%"
              height="500px"
              className="border border-gray-300 rounded-lg"
            ></iframe>
          </div>
        )}

        
        {/* Button in the Center */}
        <button className="bg-[#437dcf] text-white px-28 py-7 text-lg rounded-lg shadow-md hover:bg-blue-600 font-bold transition">
          Tap to Speak!
        </button>
      </div>
    </section>
  );
}
