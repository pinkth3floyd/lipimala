import { pipeline } from "@huggingface/transformers";

export async function TestTransformer(){
    const pipe = await pipeline('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');
    
    const out = await pipe('I love transformers!');

    console.log(out);
   
    return out;

}