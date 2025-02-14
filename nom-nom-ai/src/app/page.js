import Image from "next/image";
import "./App.css";


export default function Home() {
  return (
    <section className="min-h-screen bg-[#fff88e] flex items-start justify-center">
      {/* Title */}
      <h1 className="text-[#437dcf] text-8xl bold-text transform scale-105 pt-20 ">NomNomAI</h1>
      {/* logo */}
      <div className="mt-5">
        <Image
          src="/logo.png"  
          alt="Logo"
          width={200}
          height={200}
        />
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