import { pipeline } from "@huggingface/transformers";
import PipelineSingleton from "../core/config/config";

export async function TestTransformer(){
    const pipe = await PipelineSingleton.getInstance();
    const out = await pipe('I love transformers!');

    console.log(out);
   
    return out;
}

export async function TranslatorTransformer(text: string){
    try {
        // Try to use the singleton first
        const pipe = await PipelineSingleton.getInstance();
        
        if (!pipe) {
            throw new Error('Failed to initialize translation pipeline');
        }
        
        const out = await pipe(text, { src_lang: 'eng_Latn', tgt_lang: 'hin_Deva' });
        return out;
    } catch (error) {
        console.error('Singleton pipeline failed, trying direct pipeline:', error);
        
       
    }
}