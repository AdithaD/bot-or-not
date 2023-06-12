import { Configuration, OpenAIApi } from 'openai';
import { env } from '$env/dynamic/private';

const configuration = new Configuration({
	apiKey: env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

console.log('open ai initialized');

export default openai;
