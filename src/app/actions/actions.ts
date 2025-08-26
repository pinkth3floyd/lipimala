
import { pipeline} from '@huggingface/transformers';

// export async function translateText(text: string, sourceLang: string, targetLang: string) {




//     const tokenizer = await AutoTokenizer.from_pretrained('Sakonii/distilbert-base-nepali');
//     const model = await AutoModelForMaskedLM.from_pretrained('Sakonii/distilbert-base-nepali');

    
    
//     const toconvert = "चाहिएको text यता राख्नु होला।"
//     const encoded = tokenizer.encode(toconvert);
//     const decoded = tokenizer.decode(encoded);
//     console.log(decoded);
  


//     return decoded;
//     // const generator = await pipeline('fill-mask', 'Sakonii/distilbert-base-nepali');
//     // const output = await generator(text, {
//     // });
//     // return output;
// }



export async function translateText2(text: string, sourceLang: string, targetLang: string) {

    console.log("Translating====>>>>",text, sourceLang, targetLang);
    const generator = await pipeline('translation', 'Xenova/nllb-200-distilled-600M');
    // Pass text as string and language options as second parameter
    const output = await (generator as unknown as (text: string, options: { src_lang: string; tgt_lang: string }) => Promise<unknown>)(text, { src_lang: sourceLang, tgt_lang: targetLang });


    console.log("Translated====>>>>",output);

    
    return output;
}