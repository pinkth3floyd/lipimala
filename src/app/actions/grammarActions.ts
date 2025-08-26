import GrammarCorrectorSingleton from "../core/config/grammarConfig";

export async function correctNepaliGrammar(text: string) {
    try {
        const grammarCorrector = await GrammarCorrectorSingleton.getInstance();
        
        if (!grammarCorrector) {
            throw new Error('Failed to initialize grammar correction pipeline');
        }
        
        const result = await grammarCorrector.correct(text);
        return result;
    } catch (error) {
        console.error('Grammar correction failed:', error);
        throw new Error('Failed to correct grammar');
    }
}

export async function testGrammarCorrection() {
    try {
        const testText = "म तिमीलाई मन पराउँछु"; // "I love you" in Nepali
        const result = await correctNepaliGrammar(testText);
        console.log('Grammar correction test result:', result);
        return result;
    } catch (error) {
        console.error('Grammar correction test failed:', error);
        throw error;
    }
}
