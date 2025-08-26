import Image from "next/image";
import { TestTransformer } from "./actions";

export default async function Home() {



  const result = await TestTransformer();
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">


        {
          result.map((item: any) => (
            <div key={item.label}>
              {item.label}
              {item.score}
            </div>
          ))
        }    



    </div>
  );
}
