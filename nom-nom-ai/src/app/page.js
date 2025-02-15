"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import "./App.css";
import VoiceRecorder from "./components/VoiceRecorder";
import { getDocument } from "pdfjs-dist/webpack";
import "./App.css";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [threadId, setThreadId] = useState(null);
  const fileInputRef = useRef(null);

  // Create a global thread on mount
  useEffect(() => {
    async function createThread() {
      try {
        const response = await fetch('http://localhost:3001/api/thread', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.success) {
          setThreadId(data.threadId);
        }
      } catch (err) {
        console.error('Error creating thread:', err);
      }
    }
    createThread();
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
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

        // Ensure a thread was created before sending the pdf text
        if (!threadId) {
          console.error("No thread available");
          return;
        }

        // Send the extracted text to the /api/pdf endpoint using the shared threadId
        const pdfResponse = await fetch('http://localhost:3001/api/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId: threadId,
            message: fullText,
          }),
        });
        const pdfData = await pdfResponse.json();
        console.log("Assistant response:", pdfData.response);
      };

      reader.readAsArrayBuffer(file);
    } else {
      setExtractedText("Please upload a valid PDF file.");
      setPdfUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPdfUrl(null);
    setExtractedText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="min-h-screen bg-[#fff88e] flex flex-col justify-center items-center py-10">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-[#437dcf] text-8xl bold-text transform scale-105">
          NomNomAI
        </h1>
        <Image src="/logo.png" alt="Logo" width={200} height={200} />
        <section className="bold-text bg-[#d6b285] px-6 py-4 rounded-lg shadow-lg">
          <h1 className="text-white text-2xl font-bold mb-2 text-center">
            Upload Your Recipe Here!
          </h1>
          <div className="mt-2 text-gray-500 flex flex-col items-center">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              ref = {fileInputRef}
              className="border border-gray-400 p-2 rounded-md bg-white cursor-pointer"
            />
            {selectedFile && (
              <p className="text-gray-700 mt-2">Selected File: {selectedFile.name}</p>
            )}
            {selectedFile && (
              <button
                onClick={handleRemoveFile}
                className="bg-[#cf4343] text-white px-4 py-2 mt-2 rounded-md shadow-md"
              >
                Remove File
              </button>
            )}
          </div>
        </section>
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
        {/* Pass the shared threadId to VoiceRecorder */}
        <VoiceRecorder threadId={threadId} />
      </div>
    </section>
  );
}
